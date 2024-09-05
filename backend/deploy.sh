#!/bin/sh
export HOME=/home/svkruik
export PATH=/root/.nvm/versions/node/v20.15.1/bin:$PATH

# Git
cd ..
git config --global --add safe.directory /home/svkruik/Documents/GitHub/Lumen
git reset --hard
git pull
echo "Git setup complete."

# Lumen - lumen.stefankruik.com
cd backend
[ -d logs ] || mkdir logs
npm install
echo "Lumen update complete. Reloading server."

sudo systemctl restart lumen-api.service
