#!/bin/bash
cd ~/code/node_monorepo
source ./startdev.sh
counter=1
while [ $counter -le 255 ]
do
   echo restarting $counter
   kubectl rollout restart deployment halyard-backend -n halyard
   sleep 16
   ((counter++))
done
echo All Done!
