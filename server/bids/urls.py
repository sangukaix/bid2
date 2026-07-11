from django.urls import path # URL주소 등록하는 장고 기능 가지고 오기

from .import views # 같은 bids 폴더의 views.py를 가져오기

urlpatterns = [
    path("bids/", views.bid_list), #bids 주소로 요청하면 bid_list 함수 실행
]