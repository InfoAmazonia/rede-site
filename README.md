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

# API Usage
## User routes
### Create user

```
POST /api/v1/users
```

First user will have `admin` role.

Parameters:
- `name`: _string_ User name
- `email`: _string_ User e-mail
- `password`: _string_ User password

Possible responses:
- `200` Success + user object json;
- `400` Bad request;
- `401` Unauthorized;
- `500` Internal error.

## Sensors routes
### Create sensor

```
POST /api/v1/sensors
```

Parameters:
- `identifier`: _string_ phone number or mac address (required)
- `name`: _string_ sensor's name (required)
- `description`: _string_ sensor's description
- `image`: _string_ an image url

Possible responses:
- `201` Success + sensor object json;
- `400` Bad request.
- `401` Unauthorized;

### Update sensor

```
PUT /api/v1/sensors/:sensor_id
```

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

### Remove sensor

```
DEL /api/v1/sensors/:sensor_id
```

This will **destroy all measurements** related to the sensor.

Parameters:
- `:sensor_id` _string_

Possible responses:
- `200` Success;
- `400` Bad request;
- `401` Unauthorized;
- `404` Not found.

### Get sensor

```
GET /api/v1/sensors/:sensor_id
```

Parameters:
- `:sensor_id`: _string_ (required)

Possible responses:
- `200` Success + sensor object json;
- `400` Bad request;
- `404` Not found.

### Get sensor score

```
GET /api/v1/sensors/:sensor_id/score
```

Get water quality score based on latest measurements.

Parameters:
- `:sensor_id`: _string_ (required)

Possible responses:
- `200` Success + sensor object json;
- `404` Not found.
- `500` Internal error.

Successfull result:

```
{
  sensor:
    {
      _id: '55b6446c9946ae150ab623de',
      identifier: '+5511999999949',
      name: 'Sensor 49',
      description: 'some description for Sensor 49',
      image: 'http://imguol.com/blogs/122/files/2015/07/Prototipo-foto-Miguel-PeixeDSCF1515.jpg',
      __v: 0,
      createdAt: '2015-07-27T14:47:08.037Z',
      geometry: { type: 'Point', coordinates: [-21,-34] }
    },
  score: 3.265420915558934,
  parameters: [
    '55b6446c9946ae150ab625d8',
    '55b6446d9946ae150ab62740',
    '55b6446c9946ae150ab62620',
    '55b6446c9946ae150ab62668',
    '55b6446c9946ae150ab626b0',
    '55b6446d9946ae150ab626f8',
    '55b6446d9946ae150ab62788'
  ]
}
```

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

## Parameters routes
### Get list

```
GET /api/v1/parameters
```

Response:
- `200` Success status and parameters as json:

## Measurements routes
### Get list

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
