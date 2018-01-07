
fetch('https://httpbin.org/ip')
  .then(response => {
    console.log('HTTP fetch(GET) response:', response);
    if (response.ok) {
      return response.json();
    }
    throw new Error(response.status + ' - ' + response.statusText);
  })
  .then(response => console.log('Fetch response:', response))
  .catch(error => console.log('An error occurred with fetch request:', error));

let request = {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Accpet': 'application/json'
  },
  body: JSON.stringify({ message: 'Rock will live forever!' })
};

fetch('https://httpbin.org/post', request)
  .then(response => {
    console.log('HTTP fetch(POST) response:', response);
    return response.json();
  })
  .then(response => console.log('Fetch response:', response));
