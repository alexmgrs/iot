#include <application.h>

float climate_temperature_value = 0;
float climate_humidity_value = 0;
float climate_illuminance_value = 0;
float climate_pressure_value = 0;
float climate_altitude_value = 0;

void climate_module_event_handler(twr_module_climate_event_t event, void *event_param) {
    float value;
    float meter;
    if (event == TWR_MODULE_CLIMATE_EVENT_UPDATE_THERMOMETER) {
        if (twr_module_climate_get_temperature_celsius(&value)) {
            climate_temperature_value = value;
        }
    } else if (event == TWR_MODULE_CLIMATE_EVENT_UPDATE_HYGROMETER) {
        if (twr_module_climate_get_humidity_percentage(&value)) {
            climate_humidity_value = value;
        }
    } else if (event == TWR_MODULE_CLIMATE_EVENT_UPDATE_LUX_METER) {
        if (twr_module_climate_get_illuminance_lux(&value)) {
            climate_illuminance_value = value < 1 ? 0 : value;
        }
    } else if (event == TWR_MODULE_CLIMATE_EVENT_UPDATE_BAROMETER) {
        if (twr_module_climate_get_pressure_pascal(&value) && twr_module_climate_get_altitude_meter(&meter)) {
            climate_pressure_value = value;
            climate_altitude_value = meter;
        }
    }
}

void application_init(void) {
    twr_log_init(TWR_LOG_LEVEL_DEBUG, TWR_LOG_TIMESTAMP_ABS);

    // Initialisation du module radio
    twr_radio_init(TWR_RADIO_MODE_NODE_SLEEPING);

    // Vérification de l'ID du module radio après l'initialisation
    uint64_t my_id = twr_radio_get_my_id();
    if (my_id == 0) {
        twr_log_error("Erreur: L'ID du module radio est 0 après l'initialisation");
    } else {
        twr_log_info("ID du module radio: %llu", my_id);
    }

    // Initialisation du module climat
    twr_module_climate_init();
    twr_module_climate_set_event_handler(climate_module_event_handler, NULL);
    twr_module_climate_set_update_interval_thermometer(5000);
    twr_module_climate_set_update_interval_hygrometer(5000);
    twr_module_climate_set_update_interval_lux_meter(5000);
    twr_module_climate_set_update_interval_barometer(5000);
    twr_module_climate_measure_all_sensors();

    twr_scheduler_plan_from_now(0, 1000);
}

void application_task(void) {
    twr_radio_pub_temperature(TWR_RADIO_PUB_CHANNEL_R1_I2C0_ADDRESS_DEFAULT, &climate_temperature_value);
    twr_radio_pub_luminosity(TWR_RADIO_PUB_CHANNEL_R1_I2C0_ADDRESS_DEFAULT, &climate_illuminance_value);
    twr_radio_pub_humidity(TWR_RADIO_PUB_CHANNEL_R3_I2C0_ADDRESS_DEFAULT, &climate_humidity_value);
    twr_radio_pub_barometer(TWR_RADIO_PUB_CHANNEL_R1_I2C0_ADDRESS_DEFAULT, &climate_pressure_value, &climate_altitude_value);

    twr_log_info("Pressure: %.1f ", climate_pressure_value);
    twr_log_info("Temperature: %.1f ", climate_temperature_value);
    twr_log_info("Humidity: %.1f ", climate_humidity_value);
    twr_log_info("Luminosity: %.1f ", climate_illuminance_value);
    twr_log_info("Id : %llu", twr_radio_get_my_id());

    twr_scheduler_plan_current_relative(600000);
}
