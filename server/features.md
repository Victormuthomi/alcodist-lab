## Top workers and workplaces feature

### We are adding a new endpoint to fetch3 top and workplaces

## Nearest worker notification feature

Am adding a new feature which will be notyfing the nearest worker about a shift posted on
the platform within a 100m radius range from his/her location.

### Features

1. Add a location field in the workers schema (workplace already has the field)
2. Add an automatic job to be running the new feature automatically anytime a new shift is posted

### Business logics

1. Take the workplace and workers location and convert it to co-ordinates.
1. Filter out everyone whos is inactive or has a ongoing shift.
1. Using the workplace co-ordinate calculate the lower value of the 100m radius from the workplace.
1. Filter everyone out who is out of that range.
1. Sort the remaing ones based on who is nearest to the workplace.
1. Send a notification to the nearest worker.
1. Confirm the worker has accepted the shift.

### Architecture

- We will use google apis to do the converting of location to co-ordinates
  -New folder location to be added this feature will be isolated from the 3 others

## Future improvements

- Have a way to alert the nearest worker doesn't accept the shift after some time
- Any other problem that will arise as the feature is being developed
