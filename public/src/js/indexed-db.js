
const DBStore = {
  POSTS: 'posts',
  SYNC_POSTS: 'sync-posts',
};

const dbPromise = idb.open(DBStore.POSTS + '-store', 1, db => {
  if (!db.objectStoreNames.contains(DBStore.POSTS)) {
    db.createObjectStore(DBStore.POSTS, { keyPath: 'id' });
  }
  if (!db.objectStoreNames.contains(DBStore.SYNC_POSTS)) {
    db.createObjectStore(DBStore.SYNC_POSTS, { keyPath: 'id' });
  }
});

let saveDataToIndexedDB = (storeName, data) => {
  return dbPromise.then(db => {
    let tx = db.transaction(storeName, 'readwrite');
    let store = tx.objectStore(storeName);
    store.put(data);
    return tx.complete;
  });
};

let deleteDataFromIndexedDB = (storeName, id) => {
  return dbPromise.then(db => {
    let tx = db.transaction(storeName, 'readwrite');
    let store = tx.objectStore(storeName);
    store.delete(id);
    return tx.complete;
  });
};

let getDataFromIndexedDB = storeName => {
  return dbPromise.then(db => {
    let tx = db.transaction(storeName, 'readonly');
    let store = tx.objectStore(storeName);
    return store.getAll();
  });
};

let clearAllDataFromIndexedDB = storeName => {
  return dbPromise.then(db => {
    let tx = db.transaction(storeName, 'readwrite');
    let store = tx.objectStore(storeName);
    store.clear();
    return tx.complete;
  });
};
