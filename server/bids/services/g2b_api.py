import requests # 다른 서버에 HTTP 요청을 보내는 패키지

from django.conf import settings # settings.py에 등록한 설정값을 가져옴.

SERVICE_URL = (
    "https://apis.data.go.kr/1230000/ao/PubDataOpnStdService/"
    "getDataSetOpnStdBidPblancInfo"
)  # 공공데이터 개방표준 방식의 나라장터 입찰공고 조회 주소


def fetch_bid_notices(): #나라장터 입찰공고를 가져오는 함수

    params = {
        "serviceKey" : settings.G2B_API_KEY, # .env에서 읽은 인증키
        "pageNo": 1, #조회할 페이지 번호
        "numOfRows": 10,
        "type": "json",
        "bidNtceBgnDt": "202607010000",  # 조회 시작일시
        "bidNtceEndDt": "202607112359",  # 조회 종료일시
    }

    response = requests.get( #나라장터에 겟방식으로 정보를 요청하고 제이슨으로 받음
        SERVICE_URL,
        params=params,
        timeout=10, #10초동안 응답없으면 중간
    )

    response.raise_for_status() #400, 500 같은 http 오류 있으면 에러 발생

    return response.json()
