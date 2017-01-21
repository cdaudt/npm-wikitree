# wikitree
Is a module designed to interact with the wikitree api.
Wikitree is a collective family tree collaboration. For details on it see
here: https://www.wikitree.com/
The API that this module provides access to is described here:
https://www.wikitree.com/wiki/API_Documentation

## API
The api functions are 1-for-1 implementations of the API.
They use Promises as the means to returns values to the caller.
 The available functions are:
 - sess = login(email, password): logs into a wikitree account.
   Returns a promise which resolves a session token on success. This is to be
   used on subsequent API calls
   and can also be used to retrieve the login user_id or key.
   Or rejects on errors (e.g. network).
 - getPerson (sess, key, fields):  retrieves the requested fields
 for the key provided. Fields can either be == null, which returns all
 available fields; or an array of field names to return.
 Returns a promise which resolves to a dictionary with the requested fields,
 or rejects on failure (e.g. invalid token, network error).
 - getRelatives(sess, keys, relations): retrieves the requested relations
  for the array of keys provided. *relations* is an array containing one or more of:
  [ parents, children, spouses, siblings]. If == null then queries for all
  possible relations. Returns a promise which resolves to a ..., or rejects
  on failure (e.g. invalid token, invalid relation type, network error)

## Helper functions
 - getUserId: Returns the userid for a given session object

## Calling Example
see the file: [sample/test_api.js] for an example set of calls. To use that sample
you need a valid wikitree login+password. Using that you can call:
```
$ node sample/test_api.js --user <username> --pass <password>
```
and that will call login, getPerson and getRelatives for the userid returned
by that login
