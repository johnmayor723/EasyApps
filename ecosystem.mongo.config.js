module.exports = {
  apps: [{
    name: "easyapps-mongo",
    script: "mongod",
    args: "--dbpath /opt/EasyApps/.mongo-data --port 27118 --bind_ip 127.0.0.1 --logpath /opt/EasyApps/.mongo-logs/mongod.log",
    interpreter: "none",
    autorestart: true
  }]
};
