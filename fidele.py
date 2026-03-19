print("Programme de table de multiplication")
a= int(input("entrez une valeur : "))
while a>1 or a<10:
    a= int(input("entrez une valeur : "))
    i=0
    while i<=10:
          M=a*i
          print(a, "X" ,i, "=",M)
          i=i+1
          

