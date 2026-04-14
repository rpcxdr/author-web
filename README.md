# Author Webb

# TODO
Post name should be Post_YYYYMMDD.html
Story page date should include day of the week: Posted Monday, May 1, 2020
Story page title should have sibtitle space
Fix focus bug in editor
Add admin password
Add image upload 
Make "Title of Post" bar stop on top of the page.


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

On hostgator:
----------------------------------
To get python running, on the user home root:
pip install --user flask
pip install --user flask_cors

On Windows, build and zip:
npm run build
Compress-Archive -Path .\dist\* -DestinationPath dist.zip -Force

Uplaod and unzip on hostgator:
Go to the admin filter
https://gator3212.hostgator.com:2083/cpsess4311619030/frontend/jupiter/filemanager/index.html?dir=%2fhome4%2fmary%2fpublic_html%2fadmin

Click upload and upload the zip
Right click unzip the file.