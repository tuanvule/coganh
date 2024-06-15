import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js'

// If you enabled Analytics in your project, add the Firebase SDK for Google Analytics
import { getAnalytics } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-analytics.js'

// Add Firebase products that you want to use
import { getAuth } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js'
import { getFirestore } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js'

const firebaseConfig = {
    "type": "service_account",
    "projectId": "coganh-6ab73",
    "private_key_id": "480636ab97ad7ff20805887086942da8a37a45d5",
    "private_key": "-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQCJ5OvtyrzXC6Z0\nXc97N0OxMGVWGSy5R8dMDK5izpiU4M8fa0Whr3pmsfX4NOEYpZnBs86uUZ+9uFmO\npOVxZz6+yFhq20TDuAHTRZh9A5hhp1kRdjcD7Qr9MCdOVV+tjhctDOOEbAShdVQ6\nDiKisY7VbaKKxRVIEa02S6tJaA5JVzAuvUsrqso1u/7IDyL70K6MoIp2oYjElC4C\n044am6EiTGzfkxYSLcvgL4IvJoS3M5KiLPnFGUpLnWdtqlDlgU3vhGmExKpVtT2k\nx4lsfs7Rn4jmxT4km2wi1XdwJR3ollqEgZ/hdHKIDtPU1cpxR5I3ZRuzMuMniauV\ntnzPDX+NAgMBAAECggEAA5+KO3NKRvQ9aW1VmE05cBxvbTW4IR4rtGnY4yu+gprt\nlkvBRqBPvQcMCXuKNpWTVq2czqPCaL/BSqg2hyZJVcX53MTqJ6JcGesIOLCxfk9h\nXb4Xb/j4gvKS9dH0c6D6Jurhx4b3EC7/CY95hYDY2e7JiI/pIT2lqXmPhJxBU9f2\nwiZ5MU6Y9fpBQnsDPi5d3N3i+R3C8erg8biYcm3BKkMQ13X8CvSClT5dUoBNub4A\nhbPfsnh4R0LP8fOLs9nmopVL6PMpGyRA4gEWVgNMpSMrvJE7gk4CTD1t+nYQpFGy\n0dB+pmTgB13cO4UJ1agYcy5+fpguxCPeaJcqtrZOGQKBgQC/Adutg0n/FuKdMgSP\nBKl0uK2Qa90Xu7piO64eT2dlY8iEnKPZauorib1QSjaFRpoyw3YCrQtHFFVV5gVF\nLqD65BVHHaTQzBde5kbKxbGBZoPsELR54tp+k3jEJuW7HkgP4VpVlxYBhDS7pAjr\nx19v6AyOXY8UsOa6dk5hbCyAuwKBgQC40Ia7IDuWaGfqP3pqKXW20eezuTCo+ucM\nNYYLJPejgmuo2ibpQvtxsZXKS5JOOaJBSf3RlFA0nM5IH/PjqiZr8sQY2ggOHqxv\ngUH1Mk2mjVP5pER9j7mz11suZXzE2gN+JchfkOgKsrKb/9l0HeAXHnGTaqZHub0G\ndkouIs1AVwKBgFpGx4xf1BZzu5GudUcfXfQj4Sy0PmAcQ0BwkqASyXy7R6ed3TdC\neAEx7b9IBDLDpte9WEZ1gTIMIzUhLXaATmema4QcN6zT+WvKDMWD4JyXVly5nINL\nPBe9HcQf2k6xRj/zM93mNelrkfzpz6mYprvegii7gYe3AKY6ilszZGlHAoGAWRYz\ni+o6rwL+7FzS/m+jzY+bN/gR67KeQzVduuuD766DhO47iX9/Q0vOH6iUCt8fRoeL\nMUZj7yiTCxNT9i9ju+9W9X/MGDpS9qEBEVfBNIK1swWq+jeY1Yb+7ft/zEgnHNzL\nnL12DQocrLQEt0NbbOmA6AWlx7dR1daZZWnjNJsCgYEAnbI2V75yWsvk+OYD+rNC\nG2hUTeTUEBeCQPcLMOBLqRpgEe0AbINOK9QmtcJzhL6up3bOJYd6eX10l92pZc5K\nXtrld5xemyYXOdtWpEA9CAnrk6Wx0nynPAHnmA+dubtYKIp9qr7d1kLOHQ5zfN7n\nIQ6TsKs/mAWsQYyeUyLGw18=\n-----END PRIVATE KEY-----\n",
    "client_email": "firebase-adminsdk-354yy@coganh-6ab73.iam.gserviceaccount.com",
    "client_id": "104641237597418563396",
    "auth_uri": "https://accounts.google.com/o/oauth2/auth",
    "token_uri": "https://oauth2.googleapis.com/token",
    "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
    "client_x509_cert_url": "https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk-354yy%40coganh-6ab73.iam.gserviceaccount.com",
    "universe_domain": "googleapis.com",
    'databaseURL': 'firebase-adminsdk-354yy@coganh-6ab73.iam.gserviceaccount.com',
    'storageBucket': 'coganh-6ab73.appspot.com'
};

  // Initialize Firebase
var firebaseApp = initializeApp(firebaseConfig);

var firestore = getFirestore(firebaseApp)

export { firebaseApp, firestore}