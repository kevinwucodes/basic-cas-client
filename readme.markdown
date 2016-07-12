# Basic CAS Client

A basic CAS client to authenticate against a CAS v3 Server using promises.

Note that this client does not use sessions, but rather authenticates against a CAS v3 server by passing in the ```lt``` (login ticket) and ```execution``` values.

Tested against CAS Server 4.1.x

### Install
```
npm install basic-cas-client
```

### Options (required)

* ```casBaseUrl```: URL of your CAS v3 server (e.g https://cas.example.com/cas)
* ```serviceUrl```: URL of the service redirected (e.g. https://example.com)
* ```username```: username
* ```password```: password


### Usage / Example

```
const casClient = require('basic-cas-client')

const options = {
  casBaseUrl: 'https://cas.example.com/cas',
  serviceUrl: 'https://example.com',
  username: 'johnsmith',
  password: 'passw0rd!'  
}

casClient(options)
  .then(response => {
    console.log('response is', response)
  })
  .catch(err => {
      // catch your errors here
  })
```

### MIT License
