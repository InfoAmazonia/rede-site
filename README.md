# Rede InfoAmazonia
A platform of water quality sensors.

Please read documentation on the [wiki](https://github.com/InfoAmazonia/rede).

## Getting started
Clone this repository locally and run:

```
npm install
```

Run task build to compile client app and load parameters:

```
grunt build
```

Load initial data into databases (change `rede_dev` to your db name):

```
 mongoimport --db rede_dev --file=data/parameters.json --type=json --jsonArray --upsert --upsertFields name
```

Run `npm start`.

## API
### Send measurements in batch

```
POST /api/v1/measurements
```

Sensors should use [measurement data protocol] to send measurements in batch.

Parameters:
- `phoneNumber`: Sensor's phone number, if exists (_string_);
- `macAdress`: Sensor [mac address](https://en.wikipedia.org/wiki/MAC_address) (_string_), required if `phoneNumber` doesn't exist ;
- `data`: A batch of measurements following [measurement data protocol] (_string_)

Possible responses:
- `201` Created successfully and array of measurements as JSON;
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
- `ORP`: [Reduction potencial];
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
[ph]: (https://en.wikipedia.org/wiki/PH)
[reduction potencial]: https://en.wikipedia.org/wiki/Reduction_potential
[electrical conductivity]: https://en.wikipedia.org/wiki/Electrical_resistivity_and_conductivity
[relative humidity]: https://en.wikipedia.org/wiki/Relative_humidity
[atmospheric pressure]: https://en.wikipedia.org/wiki/Atmospheric_pressure
[illuminance]: https://en.wikipedia.org/wiki/Illuminance
