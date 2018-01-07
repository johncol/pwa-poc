
let promise = new Promise((resolve, reject) => {
  setTimeout(() => {
    reject('Timeout rejected after 1 second');
  }, 1000);
});

promise
  .then(result => console.log('Value resolved block#1:', result))
  .then(result => console.log('Value resolved block#2:', result))
  .catch(error => console.log('Error rejected block#1:', error))
  .then(result => console.log('Value resolved block#3:', result))
  .catch(error => console.log('Error rejected block#2:', error));
