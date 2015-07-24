# Rede InfoAmazonia
A platform of water quality sensors.

Please read documentation on the [wiki](https://github.com/InfoAmazonia/rede).

## Getting started
Clone this repository locally and run:

```
npm install
```

To setup environment variables, create a `.env` file based on `.env.example`.

Run task build to compile client app:

```
grunt build
```

Run `npm start`.

## API
### Get one sensor

```
GET /api/v1/sensors/:sensor_id
```

Parameters:
- `:sensor_id`: _string_ (required)

Possible responses:
- `200` Success + sensor json:
- `400` Bad request;
- `404` Not four.

### Get list of sensors

```
GET /api/v1/sensors
```

Parameters:
- `perPage`: _number_ (default: 20)
- `page`: _number_ (optional)

Possible responses:
- `200` Success and list of sensors:
- `400` Bad request.

### Get list of parameters

```
GET /api/v1/parameters
```

Response:
- `200` Success status and parameters as json:

### Get list of measurements

```
GET /api/v1/measurements
```

Parameters:
- `sensor_id`: _string_ (required)
- `parameter_id`: _string_ (required)
- `perPage`: _number_ (default: 20)
- `page`: _number_ (optional)

Possible responses:
- `200` Success and list of measurements:
- `400` Bad request.

## Measurement data protocol
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
