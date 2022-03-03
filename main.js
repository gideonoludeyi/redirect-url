import './style.css';

import { customAlphabet, urlAlphabet } from 'nanoid';
import { initializeApp } from 'firebase/app';
import {
    getFirestore,
    doc,
    setDoc,
    getDoc,
    query,
    collection,
    where,
    getDocs,
} from 'firebase/firestore';

const firebaseConfig = {
    apiKey: 'AIzaSyAfRD3KswHGRkYf0JU8CJTAaTFw3dss36E',
    authDomain: 'redirect-url-c2775.firebaseapp.com',
    projectId: 'redirect-url-c2775',
    storageBucket: 'redirect-url-c2775.appspot.com',
    messagingSenderId: '81518100369',
    appId: '1:81518100369:web:8bcac570ad9b712d9d6430',
};

const nanoid = customAlphabet(urlAlphabet, 7);

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const store = getFirestore(app);

const code = window.location.pathname.slice(1); // ignore leading slash (/)

const codeWasProvidedInURL = code.length > 0;

if (codeWasProvidedInURL) {
    // redirect to url
    redirectApp(code);
} else {
    // present form to generate code from url
    defaultApp();
}

async function redirectApp(code) {
    const snapshot = await getDoc(doc(store, 'url', code));
    if (snapshot.exists()) {
        const { url } = snapshot.data();
        document.head.innerHTML = `
          <meta http-equiv="refresh" content="0; URL='${url}'" />
        `;
    } else {
        document.querySelector('#app').innerHTML = `
          <h1>Invalid Code: ${code}</h1>
        `;
    }
}

async function defaultApp() {
    document.querySelector('#app').innerHTML = `
      <h1>Enter URL</h1>
      <form class="stack">
          <input
              type="text"
              name="url"
              id="url-input"
              placeholder="http://www.example.com"
          />
          <button type="submit" id="generate-btn">Generate Code</button>
      </form>
      <div id="output"></div>
  `;
    const urlInput = document.getElementById('url-input');
    const generateBtn = document.getElementById('generate-btn');
    const output = document.getElementById('output');

    const getUrl = () =>
        new Promise((resolve, reject) => {
            function listener(e) {
                e.preventDefault();
                const url = urlInput.value;
                try {
                    new URL(url); // validate url
                } catch (error) {
                    reject(error);
                    return;
                }
                resolve(url);
            }
            generateBtn.addEventListener('click', listener, { once: true });
        });

    while (true) {
        const url = await getUrl();
        const q = query(collection(store, 'url'), where('url', '==', url));
        const snapshot = await getDocs(q);

        let code;
        if (!snapshot.empty) {
            // there is already a code that references the url
            code = snapshot.docs[0].id;
        } else {
            code = await generateUniqueCode();
            await setDoc(doc(store, 'url', code), { url });
        }

        const shortenedURL = `${window.location.origin}/${code}`;
        output.innerHTML = `
          <h2><a href='${shortenedURL}'>${code}</a></h2>
          <p>Go to <a href='${shortenedURL}'>${window.location.origin}/${code}</a></p>
        `;
        urlInput.value = '';
    }
}

async function generateUniqueCode() {
    let code;
    let snapshot;
    do {
        code = nanoid();
        snapshot = await getDoc(doc(store, 'url', code));
    } while (snapshot.exists());
    return code;
}
