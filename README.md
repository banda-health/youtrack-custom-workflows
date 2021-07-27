# youtrack-custom-workflows

This is where code for the custom workflows we've added to YouTrack is stored. The ability upload/test the custom workflows will only be available if you have admin access on YouTrack.

For information about what is available through YouTrack, check out [their workflow development portal](https://www.jetbrains.com/help/youtrack/devportal/youtrack-workflow-reference.html).

## Setup
 You'll need to do some setup on your side, so follow the [JetBrains workflows](https://www.jetbrains.com/help/youtrack/devportal/youtrack-workflow-reference.html) tutorial. Specifically, after you have installed this project, make sure you run the following commands (pulled from [this tutorial](https://www.jetbrains.com/help/youtrack/devportal/js-workflow-external-editor.html)) to ensure you can push & pull:
 - `npm config set token_prod <token>`
 - `npm config set host_prod <address>`

 where `<token>` is the [Permanent Token you must create](https://www.jetbrains.com/help/youtrack/devportal/Manage-Permanent-Token.html#obtain-permanent-token) and `<address>` is our YouTrack URL, which is currently https://issues.bandahealth.org.

 After handling the above, the following commands will be available:
- `npm run list-prod`
- `npm run download-prod -- <workflow name>`
- `npm run upload-prod -- <workflow name>`

We currently only have a PROD environment.