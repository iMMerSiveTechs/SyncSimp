UPDATE Project 
SET revenueCatApiKey = 'YOUR_KEY_HERE',
    updatedAt = datetime('now')
WHERE id = '304ea0c9-019d-425d-8b9f-051de0cdfbc8';

SELECT id, revenueCatApiKey, updatedAt FROM Project WHERE id = '304ea0c9-019d-425d-8b9f-051de0cdfbc8';
