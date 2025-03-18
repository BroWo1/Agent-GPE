from django.shortcuts import render

# Create your views here.
from django.http import HttpResponse
from django.shortcuts import render
from datetime import datetime
import io
import sys
from django.shortcuts import render
def index(request):
    return render(request, 'index.html')