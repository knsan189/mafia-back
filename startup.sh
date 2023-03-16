#!/bin/bash

npm run build && 
nohup npm run start &&
echo "Starlight Main Server On" &

exit 0
