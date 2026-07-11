from django.http import JsonResponse # 파이썬 데이터를 제이슨 응답으로 만들어라

from.services.g2b_api import fetch_bid_notices #나라장터 API 요청 함수 가져오기

def bid_list(request): #입찰공고 요청을 처리하는 함수
    data = fetch_bid_notices() # 나라장터 API 입찰공고 불러오는거

    body = data["response"]["body"] # 전체 데이터에서 바디 부분만 꺼내기
    items = body["items"] # body에서 실제 입찰공고 목록 꺼내기

    return JsonResponse({"items": items}) #브라우저에 보여주기 / 입찰 목록만 items라는 이름으로 전달하기
