    const express = require('express');
    const mysql = require('mysql');
    const bcrypt = require('bcryptjs');
    const jwt = require('jsonwebtoken');
    const cors = require('cors');

    const app = express();
    app.use(cors());
    app.use(express.json());


    let pendingMeasurements = {};

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
            res.json({ token }); // Utilisation de json ici
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

    // Fonction pour vérifier si les mesures dépassent les seuils
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

    app.post('/measurements', async (req, res) => {
        try {
            // Récupérer l'identifiant unique et les mesures depuis le corps de la requête
            const { id, temperature, humidity, luminosity, pressure } = req.body;
            const date = new Date().toISOString().slice(0, 19).replace('T', ' ');

            // Ajouter la mesure en attente de complétion
            if (!pendingMeasurements[id]) {
                pendingMeasurements[id] = { id, temperature, humidity, luminosity, pressure, date };
            } else {
                // Mettre à jour les mesures en attente avec les nouvelles données non nulles
                pendingMeasurements[id] = {
                    id,
                    temperature: temperature !== null ? temperature : pendingMeasurements[id].temperature,
                    humidity: humidity !== null ? humidity : pendingMeasurements[id].humidity,
                    luminosity: luminosity !== null ? luminosity : pendingMeasurements[id].luminosity,
                    pressure: pressure !== null ? pressure : pendingMeasurements[id].pressure,
                    date: date !== null ? date : pendingMeasurements[id].date
                };

                // Vérifier si toutes les mesures sont complètes
                const { temperature: temp, humidity: hum, luminosity: lum, pressure: press } = pendingMeasurements[id];
                if (temp !== null && hum !== null && lum !== null && press !== null) {
                    // Récupérer les seuils de la place depuis la base de données
                    const thresholds = await getThresholdsFromDatabase(id);

                    // Vérifier si les mesures dépassent les seuils
                    const exceededThresholds = checkExceededThresholds({ temperature: temp, humidity: hum, luminosity: lum, pressure: press }, thresholds);

                    // Enregistrer les mesures dans la base de données
                    await saveMeasurementsToDatabase(id, temp, hum, lum, press, date);

                    if (exceededThresholds.length > 0) {
                        // Si les seuils sont dépassés, afficher un avertissement
                        console.log(`Les mesures pour l'identifiant ${id} ont dépassé les seuils : ${exceededThresholds.join(', ')}`);
                    }

                    // Supprimer les mesures en attente pour cet identifiant
                    delete pendingMeasurements[id];
                }
            }
            res.send('Mesures reçues et enregistrées avec succès !');
        } catch (error) {
            console.error('Erreur lors de l\'enregistrement des mesures :', error);
            res.status(500).send('Erreur lors de l\'enregistrement des mesures.');
        }
    });


    app.get('/measurements/:id', (req, res) => {
        const { id } = req.params;
        db.query('SELECT * FROM measurement WHERE id = ?', [id], (err, results) => {
            if (err) {
                console.error(err);
                res.status(500).send('Error fetching measurements');
            } else {
                res.json(results);
            }
        });
    });

    app.get('/places', (req, res) => {
        try {
            // Récupérer le token d'authentification depuis le header Authorization
            const token = req.headers.authorization.split(' ')[1];
            console.log('Token:', token);

            // Décoder le token pour obtenir l'username
            const decodedToken = jwt.decode(token);
            console.log('Decoded Token:', decodedToken);

            // Récupérer l'username depuis le token décodé
            const username = decodedToken.username;
            console.log('Username:', username);

            // Interroger la base de données pour récupérer les places de l'utilisateur
            db.query('SELECT * FROM place WHERE owner = ?', [username], (err, results) => {
                if (err) {
                    console.error('Error fetching places:', err);
                    return res.status(500).send('Error fetching places');
                } else {
                    console.log('Places:', results);
                    return res.json(results);
                }
            });
        } catch (error) {
            console.error('Error:', error);
            return res.status(500).send('Internal Server Error');
        }
    });







    app.post('/place', (req, res) => {
        const placeData = req.body;

        const {
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
            last_notification_date,
            notification // Nouveau champ pour permettre le choix des notifications
        } = placeData;

        // Insérer les données dans la table place
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
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

        const placeValues = [
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
        ];

        // Insérer les données dans la table place_member pour le propriétaire
        const placeMemberQuery = `
        INSERT INTO place_member (
            place_id,
            username,
            notification
        ) VALUES (?, ?, ?)
    `;

        const placeMemberValues = [
            id,
            owner,
            notification // Utiliser la valeur fournie pour les notifications
        ];

        // Exécuter les deux requêtes en transaction pour maintenir l'intégrité des données
        db.beginTransaction(err => {
            if (err) {
                console.error('Error beginning transaction:', err);
                res.status(500).send('Error beginning transaction');
                return;
            }

            // Insérer dans la table place
            db.query(placeQuery, placeValues, (placeErr, placeResult) => {
                if (placeErr) {
                    db.rollback(() => {
                        console.error('Error inserting data into place table:', placeErr);
                        res.status(500).send('Error inserting data into place table');
                    });
                    return;
                }

                // Insérer dans la table place_member pour le propriétaire
                db.query(placeMemberQuery, placeMemberValues, (placeMemberErr, placeMemberResult) => {
                    if (placeMemberErr) {
                        db.rollback(() => {
                            console.error('Error inserting data into place_member table:', placeMemberErr);
                            res.status(500).send('Error inserting data into place_member table');
                        });
                        return;
                    }

                    // Valider la transaction
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


    app.post('/place/member', (req, res) => {
        const { place_id, username, notification } = req.body;

        // Vérifier si l'utilisateur existe dans la table users
        db.query('SELECT * FROM users WHERE username = ?', [username], (err, results) => {
            if (err) {
                console.error(err);
                res.status(500).send('Error adding member to place');
                return;
            }

            if (results.length === 0) {
                res.status(404).send('User not found');
                return;
            }

            // Vérifier si le lieu existe dans la table place
            db.query('SELECT * FROM place WHERE id = ?', [place_id], (err, results) => {
                if (err) {
                    console.error(err);
                    res.status(500).send('Error adding member to place');
                    return;
                }

                if (results.length === 0) {
                    res.status(404).send('Place not found');
                    return;
                }

                // Ajouter le membre à la table place_member
                db.query('INSERT INTO place_member (place_id, username, notification) VALUES (?, ?, ?)',
                    [place_id, username, notification],
                    (err, result) => {
                        if (err) {
                            console.error(err);
                            res.status(500).send('Error adding member to place');
                            return;
                        }

                        res.send('Member added to place successfully');
                    });
            });
        });
    });




    app.listen(3001, () => {
        console.log('Server is running on port 3001');
    });

