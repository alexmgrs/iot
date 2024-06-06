const express = require('express');
const mysql = require('mysql');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const nodemailer = require("nodemailer");
const moment = require('moment-timezone');

const app = express();
app.use(cors());
app.use(express.json());

const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'tkc2fmcRcoSTzvAZ/e',
    database: 'iot_database'
});

db.connect((err) => {
    if (err) {
        console.error('Erreur de connexion à la base de données : ', err);
        return;
    }
    console.log('Connecté à la base de données MySQL.');
});

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: 'iot.unicorn.2024@gmail.com',
        pass: 'zglkqwnxdzohzmfa'
    }
});

async function getPlaceMembersWithNotification(placeId) {
    return new Promise((resolve, reject) => {
        const query = `
            SELECT username
            FROM place_member
            WHERE place_id = ? AND notification = TRUE
        `;
        db.query(query, [placeId], (err, results) => {
            if (err) {
                reject(err);
                return;
            }
            resolve(results.map(row => row.username));
        });
    });
}



app.post('/register', async (req, res) => {
    const { username, password, email } = req.body;
    const hashedPassword = await bcrypt.hash(password, 8);

    db.query('INSERT INTO users (username, password, email) VALUES (?, ?, ?)', [username, hashedPassword, email], (err, results) => {
        if (err) {
            console.error(err);
            res.status(500).send('Error registering user');
        } else {
            res.send('User registered!');
        }
    });
});

app.post('/login', (req, res) => {
    const { username, password } = req.body;

    db.query('SELECT * FROM users WHERE username = ?', [username], async (err, results) => {
        if (err) {
            console.error(err);
            return res.status(500).send('Error authenticating user');
        }
        if (results.length === 0 || !(await bcrypt.compare(password, results[0].password))) {
            return res.status(401).send('Invalid credentials');
        }

        const token = jwt.sign({ username: results[0].username }, 'yourSecretKey', { expiresIn: '1h' });
        res.json({ token });
        console.log(token);
    });
});

async function getThresholdsFromDatabase(placeId) {
    return new Promise((resolve, reject) => {
        const query = 'SELECT * FROM place WHERE id = ?';
        db.query(query, [placeId], (err, results) => {
            if (err) {
                reject(err);
                return;
            }
            if (results.length === 0) {
                reject(new Error('Place not found'));
                return;
            }
            const thresholds = results[0];
            resolve(thresholds);
        });
    });
}

function checkExceededThresholds(measurements, thresholds) {
    const exceededThresholds = [];
    if (measurements.temperature < thresholds.threshold_temperature_min || measurements.temperature > thresholds.threshold_temperature_max) {
        exceededThresholds.push('Temperature');
    }
    if (measurements.pressure < thresholds.threshold_pressure_min || measurements.pressure > thresholds.threshold_pressure_max) {
        exceededThresholds.push('Pressure');
    }
    if (measurements.humidity < thresholds.threshold_humidity_min || measurements.humidity > thresholds.threshold_humidity_max) {
        exceededThresholds.push('Humidity');
    }
    if (measurements.luminosity < thresholds.threshold_luminosity_min || measurements.luminosity > thresholds.threshold_luminosity_max) {
        exceededThresholds.push('Luminosity');
    }
    return exceededThresholds;
}

async function saveMeasurementsToDatabase(id, temperature, humidity, luminosity, pressure, date) {
    return new Promise((resolve, reject) => {
        db.query('INSERT INTO measurement (id, temperature, humidity, luminosity, pressure, date) VALUES (?, ?, ?, ?, ?, ?)',
            [id, temperature, humidity, luminosity, pressure, date],
            (err, result) => {
                if (err) {
                    console.error(`Erreur lors de l'enregistrement des mesures pour l'identifiant ${id} :`, err);
                    reject(err);
                    return;
                }
                console.log(`Mesures pour l'identifiant ${id} enregistrées avec succès.`);
                resolve();
            });
    });
}
async function updateLastNotificationDate(placeId) {
    return new Promise((resolve, reject) => {
        const currentDate = getCurrentDateTime();
        const query = 'UPDATE place SET last_notification_date = ? WHERE id = ?';
        db.query(query, [currentDate, placeId], (err, results) => {
            if (err) {
                console.error('Erreur lors de la mise à jour de la date de dernière notification :', err);
                reject(err);
                return;
            }
            console.log(`Date de dernière notification mise à jour pour le lieu ${placeId} : ${currentDate}`);
            resolve();
        });
    });
}


app.post('/measurements', async (req, res) => {
    try {
        const { id, temperature, humidity, luminosity, pressure } = req.body;
        const date = getCurrentDateTime();

        console.log(`Reçu: id=${id}, temperature=${temperature}, humidity=${humidity}, luminosity=${luminosity}, pressure=${pressure}, date=${date}`);
        console.log('0');

        console.log('Mise à jour des valeurs avec les nouvelles valeurs non nulles');
        console.log(`Valeurs avant mise à jour: ${JSON.stringify(req.body)}`);

        const updatedMeasurements = {
            id,
            temperature: temperature !== null ? temperature : null,
            humidity: humidity !== null ? humidity : null,
            luminosity: luminosity !== null ? luminosity : null,
            pressure: pressure !== null ? pressure : null,
            date
        };

        console.log(`Valeurs après mise à jour: ${JSON.stringify(updatedMeasurements)}`);
        console.log('1');

        const { temperature: temp, humidity: hum, luminosity: lum, pressure: press } = updatedMeasurements;
        console.log(`temp=${temp}, hum=${hum}, lum=${lum}, press=${press}`);

        if (temp !== null && hum !== null && lum !== null && press !== null) {
            console.log('Toutes les mesures sont complètes, enregistrement dans la base de données');
            await saveMeasurementsToDatabase(id, temp, hum, lum, press, date);
            console.log(`Mesures pour l'identifiant ${id} enregistrées avec succès dans la base de données`);

            const thresholds = await getThresholdsFromDatabase(id);
            console.log(`Seuils récupérés: ${JSON.stringify(thresholds)}`);

            const exceededThresholds = checkExceededThresholds({ temperature: temp, humidity: hum, luminosity: lum, pressure: press }, thresholds);
            console.log(`Seuils dépassés: ${exceededThresholds}`);

            if (exceededThresholds.length > 0) {
                console.log(`Les mesures pour l'identifiant ${id} ont dépassé les seuils : ${exceededThresholds.join(', ')}`);

                const ongoingAlerts = await checkOngoingAlerts(id, exceededThresholds);
                console.log(`Alertes en cours: ${JSON.stringify(ongoingAlerts)}`);

                if (ongoingAlerts.length === 0) {
                    await createAlert(id, exceededThresholds);
                    const recipientEmails = await getPlaceMembersWithNotification(id);

                    if (recipientEmails.length > 0) {
                        console.log(`Envoi d'e-mails aux destinataires : ${recipientEmails.join(', ')}`);
                        await sendAlertEmail(id, exceededThresholds, recipientEmails);
                    } else {
                        console.log('Aucun destinataire trouvé pour les notifications.');
                    }
                } else {
                    console.log('Aucune nouvelle alerte créée car une alerte est déjà en cours pour ce type de mesure.');
                }
            }

            // Vérifiez et mettez à jour les alertes résolues
            await checkAndUpdateResolvedAlerts();
        }

        res.send('Mesures reçues et enregistrées avec succès !');
    } catch (error) {
        console.error('Erreur lors de l\'enregistrement des mesures :', error);
        res.status(500).send('Erreur lors de l\'enregistrement des mesures');
    }
});






async function checkOngoingAlerts(placeId, exceededThresholds) {
    return new Promise((resolve, reject) => {
        const query = `
            SELECT *
            FROM alert
            WHERE place_id = ? AND measurement_type IN (?) AND alert_end IS NULL
        `;
        db.query(query, [placeId, exceededThresholds], (err, results) => {
            if (err) {
                console.error('Erreur lors de la vérification des alertes en cours :', err);
                reject(err);
                return;
            }
            resolve(results);
        });
    });
}

async function createAlert(placeId, exceededThresholds) {
    return new Promise((resolve, reject) => {
        const queries = exceededThresholds.map(type => {
            const id = generateUniqueId(); // Fonction pour générer un ID unique
            const startDate = getCurrentDateTime();
            const query = `
                INSERT INTO alert (id, place_id, alert_start, measurement_type)
                VALUES (?, ?, ?, ?)
            `;
            return new Promise((res, rej) => {
                db.query(query, [id, placeId, startDate, type], (err, results) => {
                    if (err) {
                        console.error(`Erreur lors de la création de l'alerte pour le type de mesure ${type} :`, err);
                        rej(err);
                    } else {
                        res();
                    }
                });
            });
        });

        Promise.all(queries)
            .then(() => resolve())
            .catch(reject);
    });
}

async function updateAlertEnd(placeId, measurementType) {
    return new Promise((resolve, reject) => {
        const query = `
            UPDATE alert
            SET alert_end = ?
            WHERE place_id = ? AND measurement_type = ? AND alert_end IS NULL
        `;
        db.query(query, [getCurrentDateTime(), placeId, measurementType], async (err, results) => {
            if (err) {
                console.error('Erreur lors de la mise à jour de la fin de l\'alerte :', err);
                reject(err);
            } else {
                try {
                    // Récupérer les emails des membres du lieu avec notifications activées

                    const recipientEmails = await getPlaceMembersWithNotification(placeId);

                    // Envoyer des notifications de fin d'alerte par e-mail
                    if (recipientEmails.length > 0) {
                        console.log(`Envoi d'e-mails de fin d'alerte aux destinataires : ${recipientEmails.join(', ')}`);
                        await sendAlertEndEmail(placeId, measurementType, recipientEmails);
                    } else {
                        console.log('Aucun destinataire trouvé pour les notifications de fin d\'alerte.');
                    }
                } catch (error) {
                    console.error('Erreur lors de la gestion de la fin d\'alerte :', error);
                }
                resolve();
            }
        });
    });
}

async function sendAlertEmail(id, exceededThresholds, recipientEmails) {
    const mailOptions = {
        from: 'iot.unicorn.2024@gmail.com',
        to: recipientEmails.join(', '),
        subject: `Alert: Threshold Exceeded for ID ${id}`,
        text: `The following measurements for ID ${id} have exceeded the thresholds: ${exceededThresholds.join(', ')}.`
    };

    return new Promise((resolve, reject) => {
        transporter.sendMail(mailOptions, async (error, info) => {
            if (error) {
                console.error('Error sending email:', error);
                reject(error);
            } else {
                console.log('Email sent:', info.response);
                // Mettre à jour la date de la dernière notification dans la base de données
                try {
                    await updateLastNotificationDate(id);
                    resolve();
                } catch (err) {
                    console.error('Error updating last notification date:', err);
                    reject(err);
                }
            }
        });
    });
}
async function sendAlertEndEmail(placeId, measurementType, recipientEmails) {

    const mailOptions = {
        from: 'iot.unicorn.2024@gmail.com', // Remplacez par votre adresse email
        to: recipientEmails.join(', '),
        subject: `Fin de l'alerte pour ${measurementType} à la place ${placeId}`,
        text: `L'alerte pour ${measurementType} à la place ${placeId} est maintenant terminée.`
    };

    try {
        await transporter.sendMail(mailOptions);
        console.log(`Email de fin d'alerte envoyé à : ${recipientEmails.join(', ')}`);
    } catch (error) {
        console.error('Erreur lors de l\'envoi de l\'email de fin d\'alerte :', error);
    }
}

// Fonction pour vérifier et mettre à jour les alertes résolues
async function checkAndUpdateResolvedAlerts() {
    return new Promise((resolve, reject) => {
        const query = `
            SELECT *
            FROM alert
            WHERE alert_end IS NULL
        `;
        db.query(query, async (err, results) => {
            if (err) {
                console.error('Erreur lors de la récupération des alertes en cours :', err);
                reject(err);
                return;
            }

            const updates = results.map(async alert => {
                const { place_id, measurement_type } = alert;
                const latestMeasurement = await getLatestMeasurement(place_id, measurement_type);
                const thresholds = await getThresholdsFromDatabase(place_id);
                const exceededThresholds = checkExceededThresholds(latestMeasurement, thresholds);

                if (!exceededThresholds.includes(measurement_type)) {
                    await updateAlertEnd(place_id, measurement_type);
                }
            });

            Promise.all(updates)
                .then(() => resolve())
                .catch(reject);
        });
    });
}


async function getLatestMeasurement(placeId, measurementType) {
    return new Promise((resolve, reject) => {
        const query = `
            SELECT *
            FROM measurement
            WHERE id = ?
            ORDER BY date DESC
            LIMIT 1
        `;
        db.query(query, [placeId], (err, results) =>  {
            if (err) {
                console.error('Erreur lors de la récupération des dernières mesures :', err);
                reject(err);
                return;
            }
            resolve(results[0]);
        });
    });
}

const generateUniqueId = () => {
    return 'alert_' + Math.random().toString(36).substr(2, 9);
};

// Planifier une vérification périodique des alertes résolues toutes les X minutes


const getCurrentDateTime = () => {
    return moment().tz('Europe/Paris').format('YYYY-MM-DD HH:mm:ss');
};

async function checkNotificationDelay(placeId) {
    return new Promise((resolve, reject) => {
        const query = 'SELECT last_notification_date FROM place WHERE id = ?';
        db.query(query, [placeId], (err, results) => {
            if (err) {
                console.error('Erreur lors de la vérification de la dernière notification :', err);
                reject(err);
                return;
            }

            if (results.length === 0) {
                reject(new Error('Place not found'));
                return;
            }

            const lastNotificationDate = results[0].last_notification_date;
            if (!lastNotificationDate) {
                console.log('Pas de notification précédente trouvée.');
                resolve(true);
                return;
            }

            const currentTime = moment().tz('Europe/Paris');
            const lastNotificationTime = moment.tz(lastNotificationDate, 'Europe/Paris');
            const timeDifferenceInMinutes = currentTime.diff(lastNotificationTime, 'minutes');
            console.log(`Temps écoulé depuis la dernière notification : ${timeDifferenceInMinutes} minutes`);

            resolve(timeDifferenceInMinutes >= 60);
        });
    });
}


app.get('/measurements/:id', (req, res) => {
    const { id } = req.params;
    const { startDate, endDate } = req.query;

    let query = 'SELECT * FROM measurement WHERE id = ?';
    const params = [id];

    if (startDate && endDate) {
        query += ' AND date BETWEEN ? AND ?';
        params.push(startDate, endDate);
    }

    db.query(query, params, (err, results) => {
        if (err) {
            console.error(err);
            res.status(500).send('Error fetching measurements');
        } else {
            res.json(results);
        }
    });
});


app.post('/get-email', (req, res) => {
    try {
        const token = req.headers.authorization.split(' ')[1];
        console.log('Token:', token);

        const decodedToken = jwt.decode(token);
        console.log('Decoded Token:', decodedToken);

        const username = decodedToken.username;

        console.log('Username:', username);

        // Step 1: Get the email for the username
        db.query('SELECT email FROM users WHERE username = ?', [username], (err, userResults) => {
            if (err) {
                console.error('Error fetching user email:', err);
                return res.status(500).send('Error fetching user email');
            }

            if (userResults.length === 0) {
                return res.status(404).send('User not found');
            }

            const email = userResults[0].email;
            console.log('Email:', email);
            return res.json({ email });
        });
    } catch (error) {
        console.error('Error:', error);
        return res.status(500).send('Internal Server Error');
    }
});


app.get('/places', (req, res) => {
    try {
        const token = req.headers.authorization.split(' ')[1];
        console.log('Token:', token);

        const decodedToken = jwt.decode(token);
        console.log('Decoded Token:', decodedToken);

        const username = decodedToken.username;

        console.log('Username:', username);

        // Step 1: Get the email for the username
        db.query('SELECT email FROM users WHERE username = ?', [username], (err, userResults) => {
            if (err) {
                console.error('Error fetching user email:', err);
                return res.status(500).send('Error fetching user email');
            }

            if (userResults.length === 0) {
                return res.status(404).send('User not found');
            }

            const email = userResults[0].email;
            console.log('Email:', email);

            // Step 2: Get the place IDs for the email
            db.query('SELECT place_id FROM place_member WHERE username = ?', [email], (err, placeMemberResults) => {
                if (err) {
                    console.error('Error fetching place members:', err);
                    return res.status(500).send('Error fetching place members');
                }

                if (placeMemberResults.length === 0) {
                    return res.status(404).send('No places found for this user');
                }

                const placeIds = placeMemberResults.map(row => row.place_id);
                console.log('Place IDs:', placeIds);

                // Step 3: Get the places based on the place IDs
                db.query('SELECT * FROM place WHERE id IN (?)', [placeIds], (err, placeResults) => {
                    if (err) {
                        console.error('Error fetching places:', err);
                        return res.status(500).send('Error fetching places');
                    } else {
                        console.log('Places:', placeResults);
                        return res.json(placeResults);
                    }
                });
            });
        });
    } catch (error) {
        console.error('Error:', error);
        return res.status(500).send('Internal Server Error');
    }
});


app.get('/places/:id', (req, res) => {
    const placeId = req.params.id;
    db.query('SELECT * FROM place WHERE id = ?', [placeId], (err, results) => {
        if (err) {
            console.error('Error fetching place details:', err);
            return res.status(500).send('Error fetching place details');
        }
        if (results.length === 0) {
            return res.status(404).send('Place not found');
        }
        res.json(results[0]);
    });
});



app.post('/place', (req, res) => {
    const placeData = req.body;

    const {
        id,
        name,
        description,
        threshold_temperature_min,
        threshold_temperature_max,
        threshold_pressure_min,
        threshold_pressure_max,
        threshold_humidity_min,
        threshold_humidity_max,
        threshold_luminosity_min,
        threshold_luminosity_max,
    } = placeData;

    // Récupérer le nom d'utilisateur à partir du token JWT
    const token = req.headers.authorization.split(' ')[1];
    const decodedToken = jwt.decode(token);
    const owner = decodedToken.username;

    // Récupérer l'email associé à l'username dans la table users
    const getEmailQuery = 'SELECT email FROM users WHERE username = ?';
    db.query(getEmailQuery, [owner], (getEmailErr, getEmailResult) => {
        if (getEmailErr) {
            console.error('Error fetching email for username:', getEmailErr);
            res.status(500).send('Error fetching email for username');
            return;
        }

        const ownerEmail = getEmailResult[0].email;

        const placeQuery = `
            INSERT INTO place (
                id,
                name,
                description,
                owner,
                threshold_temperature_min,
                threshold_temperature_max,
                threshold_pressure_min,
                threshold_pressure_max,
                threshold_humidity_min,
                threshold_humidity_max,
                threshold_luminosity_min,
                threshold_luminosity_max,
                last_notification_date
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, '2004-01-01 00:00:00')
        `;

        const placeValues = [
            id,
            name,
            description,
            ownerEmail, // Utiliser l'email au lieu de l'username
            threshold_temperature_min,
            threshold_temperature_max,
            threshold_pressure_min,
            threshold_pressure_max,
            threshold_humidity_min,
            threshold_humidity_max,
            threshold_luminosity_min,
            threshold_luminosity_max
        ];

        const placeMemberQuery = `
            INSERT INTO place_member (
                place_id,
                username,
                notification
            ) VALUES (?, ?, ?)
        `;

        const placeMemberValues = [
            id,
            ownerEmail, // Utiliser l'email au lieu de l'username
            true // Mettre notification à false par défaut
        ];

        db.beginTransaction(err => {
            if (err) {
                console.error('Error beginning transaction:', err);
                res.status(500).send('Error beginning transaction');
                return;
            }

            db.query(placeQuery, placeValues, (placeErr, placeResult) => {
                if (placeErr) {
                    db.rollback(() => {
                        console.error('Error inserting data into place table:', placeErr);
                        res.status(500).send('Error inserting data into place table');
                    });
                    return;
                }

                db.query(placeMemberQuery, placeMemberValues, (placeMemberErr, placeMemberResult) => {
                    if (placeMemberErr) {
                        db.rollback(() => {
                            console.error('Error inserting data into place_member table:', placeMemberErr);
                            res.status(500).send('Error inserting data into place_member table');
                        });
                        return;
                    }

                    db.commit(commitErr => {
                        if (commitErr) {
                            db.rollback(() => {
                                console.error('Error committing transaction:', commitErr);
                                res.status(500).send('Error committing transaction');
                            });
                            return;
                        }

                        console.log('Data inserted into place and place_member tables successfully');
                        res.send('Data inserted into place and place_member tables successfully');
                    });
                });
            });
        });
    });
});




async function sendNotificationEmail(email, placeId) {
    const mailOptions = {
        from: 'iot.unicorn.2024@gmail.com',
        to: email,
        subject: `Notification for Place ID ${placeId}`,
        text: `You have been added as a member to the place with ID ${placeId}.`
    };

    transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
            console.error('Error sending email:', error);
        } else {
            console.log('Email sent:', info.response);
        }
    });
}

app.post('/place/member', (req, res) => {
    const { place_id, username, notification } = req.body;

    // Vérifiez si le lieu existe
    db.query('SELECT * FROM place WHERE id = ?', [place_id], (err, results) => {
        if (err) {
            console.error(err);
            res.status(500).send('Error checking place existence');
            return;
        }

        if (results.length === 0) {
            res.status(404).send('Place not found');
            return;
        }

        // Vérifiez les alertes en cours
        db.query('SELECT * FROM alert WHERE place_id = ? AND alert_end IS NULL', [place_id], (err, alerts) => {
            if (err) {
                console.error(err);
                res.status(500).send('Error checking ongoing alerts');
                return;
            }

            // Insérez l'utilisateur dans place_member
            db.query('INSERT INTO place_member (place_id, username, notification) VALUES (?, ?, ?)',
                [place_id, username, notification],
                (err, result) => {
                    if (err) {
                        console.error(err);
                        res.status(500).send('Error adding member to place');
                        return;
                    }

                    // Envoyez un email de notification pour l'ajout
                    sendNotificationEmail(username, place_id);

                    // Si des alertes sont en cours, envoyez un email au nouveau membre
                    if (alerts.length > 0) {
                        const alertDetails = alerts.map(alert => `Type: ${alert.measurement_type}, Start: ${alert.alert_start}`).join('\n');
                        const alertMailOptions = {
                            from: 'iot.unicorn.2024@gmail.com',
                            to: username,
                            subject: `Ongoing Alerts for Place ID ${place_id}`,
                            text: `You have been added to a place with ongoing alerts:\n\n${alertDetails}`
                        };

                        transporter.sendMail(alertMailOptions, (error, info) => {
                            if (error) {
                                console.error('Error sending alert email:', error);
                            } else {
                                console.log('Alert email sent:', info.response);
                            }
                        });
                    }

                    res.send('Member added to place successfully and email notification sent.');
                });
        });
    });
});


app.delete('/place/member', (req, res) => {
    const { place_id, username } = req.body;

    db.query('DELETE FROM place_member WHERE place_id = ? AND username = ?', [place_id, username], (err, result) => {
        if (err) {
            console.error('Error deleting member from place:', err);
            res.status(500).send('Error deleting member from place');
            return;
        }

        if (result.affectedRows === 0) {
            res.status(404).send('Member not found in place');
            return;
        }

        res.send('Member deleted from place successfully');
    });
});

app.put('/updatePlace/:id', (req, res) => {
    const placeId = req.params.id;
    const {
        name,
        description,
        threshold_temperature_min,
        threshold_temperature_max,
        threshold_pressure_min,
        threshold_pressure_max,
        threshold_humidity_min,
        threshold_humidity_max,
        threshold_luminosity_min,
        threshold_luminosity_max
    } = req.body;

    const query = `
        UPDATE place 
        SET 
            name = ?, 
            description = ?, 
            threshold_temperature_min = ?, 
            threshold_temperature_max = ?, 
            threshold_pressure_min = ?, 
            threshold_pressure_max = ?, 
            threshold_humidity_min = ?, 
            threshold_humidity_max = ?, 
            threshold_luminosity_min = ?, 
            threshold_luminosity_max = ?
        WHERE id = ?
    `;
    db.query(query, [
        name,
        description,
        threshold_temperature_min,
        threshold_temperature_max,
        threshold_pressure_min,
        threshold_pressure_max,
        threshold_humidity_min,
        threshold_humidity_max,
        threshold_luminosity_min,
        threshold_luminosity_max,
        placeId
    ], (err, results) => {
        if (err) {
            console.error(err);
            return res.status(500).send('Erreur lors de la mise à jour de la place.');
        }
        res.send('Place mise à jour avec succès.');
    });
});

app.delete('/place/:id', (req, res) => {
    const placeId = req.params.id;

    db.beginTransaction(err => {
        if (err) {
            console.error('Error beginning transaction:', err);
            return res.status(500).send('Error beginning transaction');
        }

        // Supprimer les mesures associées à cette place
        db.query('DELETE FROM measurement WHERE id = ?', [placeId], (err, result) => {
            if (err) {
                return db.rollback(() => {
                    console.error('Error deleting measurements:', err);
                    return res.status(500).send('Error deleting measurements');
                });
            }

            // Supprimer les membres associés à cette place
            db.query('DELETE FROM place_member WHERE place_id = ?', [placeId], (err, result) => {
                if (err) {
                    return db.rollback(() => {
                        console.error('Error deleting members from place:', err);
                        return res.status(500).send('Error deleting members from place');
                    });
                }

                // Supprimer la place elle-même
                db.query('DELETE FROM place WHERE id = ?', [placeId], (err, result) => {
                    if (err) {
                        return db.rollback(() => {
                            console.error('Error deleting place:', err);
                            return res.status(500).send('Error deleting place');
                        });
                    }

                    db.commit(commitErr => {
                        if (commitErr) {
                            return db.rollback(() => {
                                console.error('Error committing transaction:', commitErr);
                                return res.status(500).send('Error committing transaction');
                            });
                        }

                        res.send('Place deleted successfully');
                    });
                });
            });
        });
    });
});


app.get('/alerts', (req, res) => {
    try {
        const token = req.headers.authorization.split(' ')[1];
        console.log('Token:', token);

        const decodedToken = jwt.decode(token);
        console.log('Decoded Token:', decodedToken);

        const username = decodedToken.username;

        console.log('Username:', username);

        // Step 1: Get the email for the username
        db.query('SELECT email FROM users WHERE username = ?', [username], (err, userResults) => {
            if (err) {
                console.error('Error fetching user email:', err);
                return res.status(500).send('Error fetching user email');
            }

            if (userResults.length === 0) {
                return res.status(404).send('User not found');
            }

            const email = userResults[0].email;
            console.log('Email:', email);

            // Step 2: Get the place IDs for the email
            db.query('SELECT place_id FROM place_member WHERE username = ?', [email], (err, placeMemberResults) => {
                if (err) {
                    console.error('Error fetching place members:', err);
                    return res.status(500).send('Error fetching place members');
                }

                if (placeMemberResults.length === 0) {
                    return res.status(404).send('No places found for this user');
                }

                const placeIds = placeMemberResults.map(row => row.place_id);
                console.log('Place IDs:', placeIds);

                // Step 3: Get the alerts based on the place IDs
                db.query('SELECT * FROM alert WHERE place_id IN (?)', [placeIds], (err, alertResults) => {
                    if (err) {
                        console.error('Error fetching alerts:', err);
                        return res.status(500).send('Error fetching alerts');
                    } else {
                        console.log('Alerts:', alertResults);
                        return res.json(alertResults);
                    }
                });
            });
        });
    } catch (error) {
        console.error('Error:', error);
        return res.status(500).send('Internal Server Error');
    }
});


app.listen(3001, () => {
    console.log('Server is running on port 3001');
});
