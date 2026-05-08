
from djongo import models
class Alert(models.Model):
 vital_id=models.CharField(max_length=50)
 acknowledged=models.BooleanField(default=False)
 created_at=models.DateTimeField(auto_now_add=True)
