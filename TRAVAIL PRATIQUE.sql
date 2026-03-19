---KIPASA MONTANTANDAR FIDELE---
---NGOYI KITUMBIKA PATRICIA---
---DHALA KANZI MERDI---
---MWAMBAYI ILUNGA NICOLAS--
---BILALI NGELE PENIEL---
---LOSANGE EPAKI JULES---




CREATE DATABASE TRAVAILPRATIQUEULK

CREATE TABLE ENSEIGNANT(
IdEnseignant int primary key,
NomEnseignant varchar (30),
PostNom varchar (30),
Prenom varchar (30),
Grade varchar (30),
Etatcivil varchar (30),
Specialite varchar (30),
SexeEnseignant varchar (30),
Mail varchar (30),
Tel int,
Adresse varchar (30),
Age int,
Province varchar (30),
ÇodePostal int,
Bancaire varchar (30)
)

select*from ENSEIGNANT


INSERT INTO ENSEIGNANT(IdEnseignant,
NomEnseignant,
PostNom,
Prenom,
Grade,
Etatcivil,
Specialite,
SexeEnseignant,
Mail,
Tel,
Adresse,
Age,
Province ,
ÇodePostal, BANCAIRE ) VALUES ('1001','kaluka','MOYO','JEAN',  'CT', ' MARIE', 'MATHMATICIEN', 'M','fidelekipasa@gmail.com','0990786049','limete', '34', 'kinshasa', '243','A'),
('1002','kaluka','MOYO','JEAN', 'CT', ' MARIE', 'MATHMATICIEN','M','fidelekipasa@gmail.com','0990786049','limete', '35', 'kinshasa', '243','A'),
('1003','faustin','MOYO','JEAN', 'CT', ' MARIE','MATHMATICIEN','F','fidelekipasa@gmail.com','0990786049','lemba', '34', 'kinshasa', '243' ,'A'),
('1004','emile','OYO','JEAN', 'CT', ' MARIE','MATHMATICIEN','F','fidelekipasa@gmail.com','0990786049','matete', '34', 'kinshasa', '243' ,'A'),
('1005','kipasa','OYO','JEAN', 'CT', ' MARIE','MATHMATICIEN','M','fidelekipasa@gmail.com','0990786049','kasavubu', '37', 'kinshasa', '243' ,'A'),
('1006','jule','YOYO','JEAN', 'CT', ' MARIE', 'MATHMATICIEN','F','fidelekipasa@gmail.com','0990786049','limete', '30', 'kinshasa', '243' ,'A'),
('1007','kapita','IYO','JEAN', 'CT', ' MARIE', 'MATHMATICIEN','F','fidelekipasa@gmail.com','0990786049','lemba', '32', 'kinshasa', '243' ,'A'),
('1008','wenze','MIO','JEAN', 'CT', ' MARIE', 'MATHMATICIEN','F','fidelekipasa@gmail.com','0990786049','ngombe', '30', 'kinshasa', '243','A'),
('1009','kaka','MERY','JEAN', 'CT', ' MARIE','MATHMATICIEN','F','fidelekipasa@gmail.com','0990786049','lemba', '31', 'kinshasa', '243' ,'A'),
('10010','kalu','MWANA','JEAN', 'CT', ' MARIE', 'MATHMATICIEN','F','fidelekipasa@gmail.com','0990786049','ndjili', '39', 'kinshasa', '243' ,'A'),
('10011','kalenga','MUJIJI','JEAN', 'CT', ' MARIE','MATHMATICIEN','M','fidelekipasa@gmail.com','0990786049','bumbu', '33', 'kinshasa', '243' ,'A'),
('10012','tshibangu','MPANDA','JEAN', 'CT', ' MARIE','MATHMATICIEN','M','fidelekipasa@gmail.com','0990786049','nsele', '67', 'kinshasa', '243' ,'A'),
('10013','firtry','ULI','JEAN', 'CT', ' MARIE', 'MATHMATICIEN','M','fidelekipasa@gmail.com','0990786049','limete', '20', 'kinshasa', '243' ,'A'),
('10014','henock','ERIS','JEAN', 'CT', ' MARIE', 'MATHMATICIEN','M','fidelekipasa@gmail.com','0990786049','limete', '27', 'kinshasa', '243' ,'A'),
('10015','kaluka','EDDY','JEAN', 'CT',  ' MARIE','MATHMATICIEN','F','fidelekipasa@gmail.com','0990786049','limete', '38', 'kinshasa', '243' ,'A')

select NomEnseignant,Adresse
from ENSEIGNANT
where Adresse='limete' or Adresse='matete'

select NomEnseignant,Adresse
from ENSEIGNANT
where Adresse='lemba' or Adresse='ndjili'

select NomEnseignant,Adresse
from ENSEIGNANT
where Adresse='kasavubu' or Adresse='nsele'

select NomEnseignant,Adresse
from ENSEIGNANT
where NomEnseignant like 'ki%' or NomEnseignant like '%sa'

select NomEnseignant,Adresse
from ENSEIGNANT
where NomEnseignant like 'f%' or NomEnseignant like '%n'

select NomEnseignant,Adresse
from ENSEIGNANT
where NomEnseignant like 'he%' or NomEnseignant like '%a'


select TOP 5 Adresse ,count(IdEnseignant) as Nombre
from ENSEIGNANT
GROUP BY Adresse

select TOP 5   NomEnseignant  , MIN (Age) as Age
from ENSEIGNANT
GROUP BY NomEnseignant

select  NomEnseignant ,SUM(Age) as Age
from ENSEIGNANT
GROUP BY NomEnseignant
HAVING SUM(Age)>20



select TOP 15 NomEnseignant ,count(Age) as Age
from ENSEIGNANT
GROUP BY NomEnseignant
HAVING count(Age)<67

select NomEnseignant ,MAX(Age) as Age
from ENSEIGNANT
GROUP BY NomEnseignant
HAVING MAX(Age)>50

select NomEnseignant ,MAX(Age) as Age
from ENSEIGNANT
GROUP BY NomEnseignant
HAVING MAX(Age)<=20



select TOP 15 NomEnseignant,PostNom,Prenom,Age
from ENSEIGNANT
ORDER BY Age ASC



select TOP 15 NomEnseignant,PostNom,Prenom,Age
from ENSEIGNANT
ORDER BY Age DESC


select TOP 5 Adresse,COUNT(IdEnseignant) as Nombre
from ENSEIGNANT
GROUP BY Adresse
ORDER BY count(IdEnseignant) DESC


ALTER TABLE ENSEIGNANT
ADD NomMateriel varchar

ALTER TABLE ENSEIGNANT
ADD QuantiteMateriel int


UPDATE ENSEIGNANT
SET Etatcivil='CELIBATAIRE'
where IdEnseignant='1001'

UPDATE ENSEIGNANT
SET Specialite='INFORMATICIEN'
where IdEnseignant='1001'

UPDATE ENSEIGNANT
SET Etatcivil='CELIBATAIRE'
where IdEnseignant='1002'

UPDATE ENSEIGNANT
SET Specialite='PHILOSOPHE'
where IdEnseignant='1002'

select*from ENSEIGNANT

select NomEnseignant,SexeEnseignant,Age
from ENSEIGNANT
where Age>(
select AVG(Age)
from ENSEIGNANT
)

select NomEnseignant,SexeEnseignant,Age
from ENSEIGNANT
where Age<(
select AVG(Age)
from ENSEIGNANT
)

CREATE VIEW INFORMATION
with encryption
as select NomEnseignant,SexeEnseignant,Age
from ENSEIGNANT
where Adresse='limete'


CREATE VIEW COMPTE
with encryption
as select NomEnseignant,SexeEnseignant,Age,IdEnseignant
from ENSEIGNANT
where IdEnseignant='1001'


CREATE VIEW BENEFICE
with encryption
as select NomEnseignant,SexeEnseignant,Age
from ENSEIGNANT
where Adresse='matete'


CREATE VIEW JACK
with encryption
as select NomEnseignant,SexeEnseignant,Age
from ENSEIGNANT
where Age='67'


CREATE VIEW FRANCE24
with encryption
as select NomEnseignant,SexeEnseignant,Age
from ENSEIGNANT
where Province='kinshasa'


CREATE PROCEDURE AFFICHERENSEIGNANT
AS 
BEGIN
select*FROM ENSEIGNANT;
END
EXEC AFFICHERENSEIGNANT



CREATE PROCEDURE MODIFIENSEIGNANT

(
@IdEnseignant int,
@Adresse varchar(50),
@Age int
)
AS
BEGIN
    UPDATE ENSEIGNANT
	set Adresse = @Adresse,
	    Age = @Age
    where IdEnseignant = @IdEnseignant
	end


EXEC MODIFIENSEIGNANT 1001, 'limete', '34'


CREATE PROCEDURE SUPPRIMERENSEIGNANT
(
@IdEnseignant int
)
AS
BEGIN
     DELETE FROM ENSEIGNANT
	 where IdEnseignant = @IdEnseignant;
	 end

	 EXEC SUPPRIMERENSEIGNANT 1




select*from ENSEIGNANT



