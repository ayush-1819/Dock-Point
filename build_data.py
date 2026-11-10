# One-off generator for data/*.json and data/seed.js (already run; kept for reference)
import json, math
def fee(w): return 10000 if w<=10 else 20000 if w<=50 else 45000
def price(w,p): return round(fee(w)*(1.15 if p else 1))
raw=[("Rajat Shetty","9817394829","rajatshetty12@gmail.com","6627112892","AJFKE2939N",12,[(15,1),(40,0),(35,0),(20,0),(39,0)]),
("Varun Rajput","9473882945","varun332@gmail.com","1144847294","REKQH4439N",14,[(21,0),(33,0),(52,0)]),
("Rudra Pandey","8834123399","rpsus996@outlook.com","8842992448","NNREN2230R",10,[(23,1),(40,0)]),
("Arjan Shastri","8447283749","arjanshastri23@gmail.com","4438193748","EFNRJ2394K",7,[(23,0),(40,1)]),
("Tulsidas Khan","7738942054","tulsiji334@outlook.com","8549204493","TSKRW2390K",4,[(33,1),(70,0),(44,0),(64,0)]),
("Akshat Ganda","9090933871","ak47inass@gmail.com","5468242964","ASEUK2094C",19,[(89,0),(12,0)]),   # dataset said ship 39 (outside 1-30)
("Vansh Bagal","6239079531","iamgay@gmail.com","8842992449","NNREN2230J",11,[(3,1),(40,0)]),
("Sanskar","8294637355","lundlogemera396@outlook.com","1842392448","NNSWN2930R",22,[(67,0),(40,0)]),  # dataset said ship 41
("Ayush Badyal","8082531802","ayushbadyal6@gmail.com","8842990889","REKEN8230R",5,[(32,1),(40,0),(89,0)])]
slots=[];n=1
for d in (12,13,14,15):
    for t in ("06:00","12:00","18:00"):
        slots.append({"id":n,"date":f"2026-11-{d}","time":t});n+=1
clients=[];k=0
for i,(nm,ct,em,pw,pan,sh,cg) in enumerate(raw):
    cargo=[]
    for j,(w,p) in enumerate(cg):
        loaded = (i in (0,2) and j==0)
        cargo.append({"id":f"C{i+1}{j+1}","weight":w,"premium":bool(p),"loaded":loaded,"slot":None if loaded else slots[k%12]["id"],
                      "containers":math.ceil(w/25),"price":price(w,p)});
        if not loaded:k+=1
    clients.append({"name":nm,"contact":ct,"email":em,"password":pw,"business":"Merchant","pan":pan,"aadhaar":"","ship":sh,"cargo":cargo})
maint={6:3,13:5,21:2,27:7,30:4}
port={"totalContainers":2000,"containerCapacityTon":25,"premiumCapacity":10,
 "labour":{"total":50000,"assigned":0,"perTon":15},
 "ships":[{"no":s,"status":"maintenance" if s in maint else "available","maintenanceDays":maint.get(s,0)} for s in range(1,31)],
 "slots":slots}
auth={"name":"Ashok Gupta","officeId":"846283974931","password":"ASGU343"}
for n,v in (("clients",clients),("new_users",[]),("authority",auth),("port",port)):
    json.dump(v,open(f"data/{n}.json","w"),indent=2)
db={n:json.load(open(f"data/{n}.json")) for n in("clients","new_users","authority","port")}
open("data/seed.js","w").write("window.SEED="+json.dumps(db)+";")
