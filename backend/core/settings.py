
SECRET_KEY='edge-ml'
DEBUG=True
INSTALLED_APPS=[
 'django.contrib.auth','django.contrib.contenttypes',
 'django.contrib.sessions','django.contrib.staticfiles',
 'users','monitoring','alerts','ingestion'
]
DATABASES={
 'default':{
  'ENGINE':'djongo',
  'NAME':'vital_monitor_db'
 }
}
AUTH_USER_MODEL='users.User'
ROOT_URLCONF='core.urls'
