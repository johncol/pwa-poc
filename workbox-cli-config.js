module.exports = {
  "globDirectory": "public\\",
  "globPatterns": [
    "**/*.{html,ico,json,js,css}",
    "src\\images\\*.{png,jpg}"
  ],
  "swSrc": "public/service-worker-base.js",
  "swDest": "public/workbox-service-worker.js",
  "globIgnores": [
    "..\\workbox-cli-config.js",
    "help\\**",
    "404.html"
  ]
};
