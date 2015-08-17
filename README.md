# Rede InfoAmazonia
A platform of water quality sensors made with open source technology.

# Getting started
Clone this repository locally and run:

```
npm install
```

For production environments, create a `.env` file based on `.env.example`.

Compile the client application:

```
grunt build
```

Run `npm start`.

# API Documentation

All routes should be prefixed with 'api/v1'.

## Users
- [GET users](#get-users)
- [POST users](#post-users)
- [PUT users/:user_id](#put-usersuser_id)
- [DEL users/:user_id](#del-usersuser_id)

## Account

- [GET account](#get-account)
- [PUT account](#put-account)

## Sensors
- [GET sensors](#get-sensors)
- [POST sensors](#post-sensorsnew)
- [GET sensors/:sensor_id](#get-sensorssensor_id)
- [PUT sensors/:sensor_id](#put-sensorssensor_id)
- [DEL sensors/:sensor_id](#del-sensorssensor_id)
- [GET sensors/:sensor_id/scores](#get-sensorssensor_idscores)
- [POST sensors/:sensor_id/subscribe](#post-sensorssensor_idsubscribe)
- [POST sensors/:sensor_id/unsubscribe](#post-sensorssensor_idunsubscribe)
- [POST sensors/:sensor_id/unsubscribe](#post-sensorssensor_idunsubscribe)
- [GET sensors/:sensor_id/measurements/:parameter_id.csv](#get-sensorssensor_idmeasurementsparameter_idcsv)


## Measurements
- [GET measurements](#get-measurements)
- [GET measurements/aggregate](#get-measurementsaggregate)
- [POST measurements/new](#post-measurementsnew)
- [GET measurements/:measurement_id](#get-measurementssensor_id)
- [PUT measurements/:measurement_id](#put-measurementssensor_id)
- [DEL measurements/:measurement_id](#del-measurementsmeasurement_id)

## Users

### GET account

Gets account information.

Possible responses:
- `200` Success + user object json;
- `401` Unauthorized;
- `500` Internal error.

---

### PUT account

Updates account information.

Parameters:
- `name`: _string_
- `email`: _string_
- `phoneNumber`: _string_
- `password`: _string_
- `oldPassword`: _string_ (required when `password` is provided)

Possible responses:
- `200` Success + user object json;
- `400` Bad request;
- `401` Unauthorized;
- `500` Internal error.

---

### GET users

Get a list of users, needs authentication and `admin` role.

Parameters:
- `perPage`: _number_ (default: 20)
- `page`: _number_ (optional)

Possible responses:
- `200` Success and list of users:
- `400` Bad request.
- `401` Unauthorized.

---

### POST users

Creates a user. The first created user will have `admin` role.

Parameters:
- `name`: _string_
- `email`: _string_
- `phoneNumber`: _string_
- `password`: _string_

Possible responses:
- `200` Success + user object json;
- `400` Bad request;
- `401` Unauthorized;
- `500` Internal error.

---

### GET users/:user_id

Get user details.

Parameters:
- `:user_id`: _string_ (required)

Possible responses:
- `200` Success and JSON:
- `400` Bad request.
- `401` Unauthorized.

---

### PUT users/:user_id

Route for admins to update account details of another user.

Parameters:
- `role`: _string_ `admin` or `subscriber`
- `name`: _string_
- `email`: _string_
- `phoneNumber`: _string_
- `password`: _string_

Possible responses:
- `200` Success + user object json;
- `400` Bad request;
- `401` Unauthorized;
- `500` Internal error.

---

### DEL users/:user_id

Delete user.

Needs authentication and "admin" role.

Possible responses:
- `200` Success;
- `401` Unauthorized;
- `404` Not found;
- `500` Internal error.

---

## Sensors

### GET sensors

Get a list of sensors.

Parameters:
- `perPage`: _number_ (default: 20)
- `page`: _number_ (optional)

Possible responses:
- `200` Success and list of sensors:
- `400` Bad request.

### POST sensors

Creates a new sensor.

Parameters:
- `identifier`: _string_ phone number or mac address (required)
- `name`: _string_ sensor's name (required)
- `description`: _string_ sensor's description
- `image`: _string_ an image url

Possible responses:
- `201` Success + sensor object json;
- `400` Bad request.
- `401` Unauthorized;

---

### GET sensors/:sensor_id

Get information about a single sensor.

Parameters:
- `:sensor_id`: _string_ (required)

Possible responses:
- `200` Success + sensor object json;
- `400` Bad request;
- `404` Not found.

---

### PUT sensors/:sensor_id

Updates sensor information.

Parameters:
- `:sensor_id` _string_
- `identifier`: _string_ phone number or mac address (required)
- `name`: _string_ (required)
- `description`: _string_
- `image`: _string_ an image url

Possible responses:
- `201` Success + sensor object json;
- `400` Bad request;
- `401` Unauthorized;
- `404` Not found.

---

### DEL sensors/:sensor_id

Destroy sensor and **all measurements** related to the it.

Parameters:
- `:sensor_id` _string_

Possible responses:
- `200` Success;
- `400` Bad request;
- `401` Unauthorized;
- `404` Not found.

---

### GET sensors/:sensor_id/score

Get water quality score based on latest measurements.

Parameters:
- `:sensor_id`: _string_ (required)

Possible responses:
- `200` Success + sensor object json;
- `404` Not found.
- `500` Internal error.

---

### POST sensors/:sensor_id/subscribe

Subscribes user to sensor.

Needs authentication.

Parameters:
- `:sensor_id`: _string_ (required)

Possible responses:
- `200` Success + user json;
- `401` Unauthorized;
- `404` Not found;
- `500` Internal error.

---

### POST sensors/:sensor_id/unsubscribe

Unsubscribes user to sensor.

Needs authentication.

Parameters:
- `:sensor_id`: _string_ (required)

Possible responses:
- `200` Success + user json;
- `401` Unauthorized;
- `404` Not found;
- `500` Internal error.

---

### GET sensors/:sensor_id/measurements/:parameter_id.csv

Download all measurements as CSV file. Example:

    http://rede.infoamazonia.org/sensor/1203910293029/measurements/atmospheric_pressure.csv

Possible responses:
- `200` Success + CSV file;
- `404` Not found;
- `500` Internal error.

---

## GET parameters

Returns a list of parameters.

Response:
- `200` Success status and parameters as json:

---

### DEL measurements/:measurement_id

Destroy measurement.

Parameters:
- `:measurement_id` _string_

Possible responses:
- `200` Success;
- `400` Bad request;
- `401` Unauthorized;
- `404` Not found.

---

## GET measurements

Returns a list of measurements.

Parameters:
- `sensor_id`: _string_ (required)
- `parameter_id`: _string_ (optional)
- `perPage`: _number_ (default: 20)
- `page`: _number_ (optional)

Possible responses:
- `200` Success and list of measurements:
- `400` Bad request.

---

## GET measurements/aggregate

Returns a measurements aggregate.

Parameters:
- `sensor_id`: _string_ (required)
- `parameter_id`: _string_ (required)
- `resolution`: _'month','week', 'day' or 'hour'_  (optional, default: 'day')
- `start`: _string_ [ISO 8601] (optional, default: 10 days from now)
- `end`: _string_ [ISO 8601] (optional, default: now)

Possible responses:
- `200` Success and list of measurements:
- `400` Bad request.

Example response:

```json
{
    "sensor_id": "55c9152f2e11aa7f1248125a",
    "parameter_id": "atmospheric_pressure",
    "start": "2015-07-31T21:18:40.142Z",
    "end": "2015-08-10T21:18:40.142Z",
    "aggregates": [{
        "_id": {
            "year": 2015,
            "month": 8,
            "day": 7
        },
        "max": 79270.70534555241,
        "avg": 79270.70534555241,
        "min": 79270.70534555241
    }, {
        "_id": {
            "year": 2015,
            "month": 8,
            "day": 8
        },
        "max": 102476.60015244037,
        "avg": 52827.800702361856,
        "min": 871.2151763029397
    }, {
        "_id": {
            "year": 2015,
            "month": 8,
            "day": 9
        },
        "max": 99783.68117124774,
        "avg": 56159.60560477106,
        "min": 3322.4598434753716
    }, {
        "_id": {
            "year": 2015,
            "month": 8,
            "day": 10
        },
        "max": 101622.79594223946,
        "avg": 47760.78379411378,
        "min": 1971.235773526132
    }]
}
```

---

## POST measurements/new

Send one or more measurements using [measurement data protocol].

Parameters:
- `sensorIdentifier`: _string_ (required)
- `data`: _string_ (required)

Possible responses:
- `200` Success and list of measurements:
- `400` Bad request and errors JSON;
- `404` Sensor not found.

Example request for a sensor with '5555' as identifier:

```
curl 'http://localhost:3000/api/v1/measurements/new' \
     -H "Content-Type: application/json" \
     --data-binary \
      '{"sensorIdentifier":"5555","data":"2015-08-01T10:08:15-03:00;Tw=20.3;Ta:F=78.29;pH=6.9"}' \
     --compressed
```

A list of measurements will be return as JSON, with HTTP status code 200 (success):

```
{
    "measurements": [{
        "__v": 0,
        "sensor": {
            "_id": "55c3af3e8037a34d53461da8",
            "name": "Sensor de teste",
            "identifier": "5555",
            "__v": 0,
            "createdAt": "2015-08-06T19:02:22.989Z",
            "geometry": {
                "coordinates": [{
                    "0": "1",
                    "1": "1"
                }]
            }
        },
        "collectedAt": "2015-08-01T13:08:15.000Z",
        "parameter": "water_temperature",
        "unit": null,
        "value": 20.3,
        "_id": "55c4ba47b01be2cb5b3c76b0"
    }, {
        "__v": 0,
        "sensor": {
            "_id": "55c3af3e8037a34d53461da8",
            "name": "Sensor de teste",
            "identifier": "5555",
            "__v": 0,
            "createdAt": "2015-08-06T19:02:22.989Z",
            "geometry": {
                "coordinates": [{
                    "0": "1",
                    "1": "1"
                }]
            }
        },
        "collectedAt": "2015-08-01T13:08:15.000Z",
        "parameter": "ambient_temperature",
        "unit": "F",
        "value": 78.29,
        "_id": "55c4ba47b01be2cb5b3c76b1"
    }, {
        "__v": 0,
        "sensor": {
            "_id": "55c3af3e8037a34d53461da8",
            "name": "Sensor de teste",
            "identifier": "5555",
            "__v": 0,
            "createdAt": "2015-08-06T19:02:22.989Z",
            "geometry": {
                "coordinates": [{
                    "0": "1",
                    "1": "1"
                }]
            }
        },
        "collectedAt": "2015-08-01T13:08:15.000Z",
        "parameter": "ph",
        "unit": null,
        "value": 6.9,
        "_id": "55c4ba47b01be2cb5b3c76b2"
    }]
}
```

---

# Measurement data protocol

Sensors should send data as string, using the pattern:

```

<timestamp>;<param1:unit1=value1>;<param2:unit2=value2;...>
```

- `timestamp`: when measurement was taken, following [ISO 8601] standard;
- `paramX`: type of measurement;
- `unitX`: _(optional)_ unit of measurement;
- `valueX`: observed value.

More than one measurement can be sent by adding `<paramX:unitX=valueX>` to the string, respecting the limit of 160 characters.

Accepted values for `paramX`:
- `AP`: [Atmospheric pressure];
- `EC`: [Electrical conductivity];
- `pH`: [Potential hidrogen][pH];
- `ORP`: [Oxi-reduction potencial];
- `Tw`: Water temperature;
- `Ta`: Ambiental temperature;
- `RH`: [Relative humidity];
- `L`: [Illuminance]

Example:

```

2015-07-05T22:16:18+00:00;p:1000;Tw:20;Ta:32
```

[measurement data protocol]: #measurement-data-protocol
[iso 8601]: https://en.wikipedia.org/wiki/ISO_8601
[atmospheric pressure]: https://en.wikipedia.org/wiki/Atmospheric_pressure
[electrical conductivity]: https://en.wikipedia.org/wiki/Electrical_resistivity_and_conductivity
[ph]: (https://en.wikipedia.org/wiki/PH)
[oxi-reduction potencial]: https://en.wikipedia.org/wiki/Reduction_potential
[relative humidity]: https://en.wikipedia.org/wiki/Relative_humidity
[illuminance]: https://en.wikipedia.org/wiki/Illuminance
