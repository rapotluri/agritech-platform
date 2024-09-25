## Task List
Here are a few things we need to accomplish by end of this week 
* Register a google email for the startup
* Use the email to register a Google Cloud Earth Engine Project
* Setup a service acccount to start using the API for the CHIRPS Dataset
* Store State Names and District Names for Cambodia (first use case) and set up api endpoint for other countries (GeoNames or REST Countries or OpenStreet Map)
* Set up a database (Free Tier MongoDB or any other DB)
* Set up vercel project only for MVP (switch to cloud provider for actual product because it is expensive)

### Psuedo-Algorithm for Points for a selected State/District
Psuedo Algorithm to figure out the number of points required to get all points for a certain state or district:
* Figure out the Boundaries of the state
* Divide it based on a grid structure
This article has some details that might be useful https://gis.stackexchange.com/questions/26727/dividing-a-geographic-region
