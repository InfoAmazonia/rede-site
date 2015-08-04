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

## Users
- [GET users](#get-users)
- [POST users](#post-users)
- [PUT users/:user_id](#put-usersuser_id)

## Account

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

## Measurements
- [GET measurements](#get-measurements)
- [POST measurements](#post-measurementsnew)
- [GET measurements/:measurement_id](#get-measurementssensor_id)
- [PUT measurements/:measurement_id](#put-measurementssensor_id)
- [DEL measurements/:measurement_id](#del-measurementsmeasurement_id)

## Users

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

Get a list of users, not implemented yet.

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
