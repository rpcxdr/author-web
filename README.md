# Author Webb

# Install
```
npm install
npm install --save-dev @types/node
```

# Start the servers:
Web:
```
npm run dev
```
Server:
``` 
python .\server\app.py
```

https://gator3212.hostgator.com:2083/
m: OK

https://gator3213.hostgator.com:2083/
M: e—8@p—d.com
m: o—r@e—i.com

https://www.hostgator.com/my-account/login
posts@maryhuntwebb.com X
Mary X

FTP: Use port 21 (https://www.hostgator.com/help/article/ftp-settings-and-connection)
gator3213.hostgator.com:21
No combination of upper and lowercase worked

gator3212.hostgator.com???
Mary: w—c@w—r.com
mary: 3—3@c—t.net

How to:
--------------------------------------
See python errors:
import cgitb
cgitb.enable()
print("Content-Type: text/plain\n")

How to deploy the app in a sub-folder of public_html:
Update index.jsx:
    <BrowserRouter basename="/admin">
Update vite.config.ts:
export default defineConfig({
  plugins: [react()],
  base: '/admin/',
})

Sometimes the python app just fails and returns 500s.  
Overwrite app.py with hello.py, test the url, it should work, then paste back in the app.py.  Now it will work again.  I don't know why.

# Production Deployment

Setup before deployment:
----------------------------------
On hostgator:
To get python running, on the user home root:
pip install --user flask
pip install --user flask_cors

Deploy:
----------------------------------
On Windows, build and zip:
1. npm run build
1. Compress-Archive -Path .\dist\* -DestinationPath dist.zip -Force

Upload and unzip on hostgator:
1. Go to the admin folder:
https://gator3212.hostgator.com:2083/cpsess4311619030/frontend/jupiter/filemanager/index.html
1. Click upload and upload the zip
1. Right click unzip the file.
1. Go to public_html/cgi-bin and upload app.py
1. Go to public_html/cgi-bin/templates and upload story_template.html and story_list_template.html
1. Go to public_html/public/stories and upload imagestyle.css and style1.css

Testing:
-----------------------
https://www.maryhuntwebb.com/cgi-bin/app.py/test

NOTE: If you edit Python directly in cPanel on Hostgator, click "Use Legacy Editor".  Otherwise the script will fail to execute and return a 500 error.