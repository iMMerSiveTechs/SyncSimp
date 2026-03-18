UPDATE Project 
SET revenueCatApiKey = 'sk_DIRECT_SQL_UPDATE_TEST', 
    updatedAt = datetime('now')
WHERE id = '304ea0c9-019d-425d-8b9f-051de0cdfbc8';

SELECT id, revenueCatApiKey, updatedAt FROM Project WHERE id = '304ea0c9-019d-425d-8b9f-051de0cdfbc8';
