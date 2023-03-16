#!/bin/bash

npm run build && 
nohup npm run start &&
echo "mafiaBack Server On" &

exit 0
