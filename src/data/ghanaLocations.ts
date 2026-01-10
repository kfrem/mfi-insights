// Ghana Administrative Regions, Districts, and Major Towns
// Based on the 16-region structure (2019 onwards)

export interface GhanaRegion {
  code: string;
  name: string;
  capital: string;
  districts: GhanaDistrict[];
}

export interface GhanaDistrict {
  code: string;
  name: string;
  towns: string[];
}

export const GHANA_REGIONS: GhanaRegion[] = [
  {
    code: 'GR',
    name: 'Greater Accra',
    capital: 'Accra',
    districts: [
      { code: 'AMA', name: 'Accra Metropolitan', towns: ['Accra', 'Osu', 'James Town', 'Chorkor', 'Korle Bu', 'Kaneshie', 'Adabraka'] },
      { code: 'TMA', name: 'Tema Metropolitan', towns: ['Tema', 'Community 1', 'Community 2', 'Ashaiman', 'Sakumono'] },
      { code: 'GWM', name: 'Ga West Municipal', towns: ['Amasaman', 'Pokuase', 'Ofankor', 'Medie', 'Kutunse'] },
      { code: 'GCM', name: 'Ga Central Municipal', towns: ['Sowutuom', 'Ablekuma', 'Anyaa', 'Chantan'] },
      { code: 'GSM', name: 'Ga South Municipal', towns: ['Weija', 'Gbawe', 'Mallam', 'Bortianor', 'Kokrobite'] },
      { code: 'GEM', name: 'Ga East Municipal', towns: ['Abokobi', 'Dome', 'Taifa', 'Ashongman', 'Haatso'] },
      { code: 'LDK', name: 'La Dade Kotopon Municipal', towns: ['La', 'Teshie', 'Nungua', 'Labadi'] },
      { code: 'LNK', name: 'Ledzokuku-Krowor Municipal', towns: ['Teshie-Nungua', 'Krowor', 'Burma Camp'] },
      { code: 'AWW', name: 'Adentan Municipal', towns: ['Adentan', 'Madina', 'Adenta', 'Frafraha'] },
      { code: 'KPM', name: 'Kpone Katamanso District', towns: ['Kpone', 'Katamanso', 'Oyibi', 'Afienya'] },
      { code: 'ADA', name: 'Ada West', towns: ['Sege', 'Ada Foah', 'Big Ada'] },
      { code: 'ADE', name: 'Ada East', towns: ['Ada', 'Kasseh', 'Songor'] },
      { code: 'NSM', name: 'Ningo Prampram', towns: ['Prampram', 'Ningo', 'Dawhenya'] },
      { code: 'OKM', name: 'Okaikwei North Municipal', towns: ['Tesano', 'Achimota', 'Dzorwulu', 'Alajo'] },
      { code: 'AWK', name: 'Ayawaso West Municipal', towns: ['Dansoman', 'Mamprobi', 'Mpoase'] },
      { code: 'AYN', name: 'Ayawaso North Municipal', towns: ['Kanda', 'North Kaneshie'] },
      { code: 'AYE', name: 'Ayawaso East Municipal', towns: ['Nima', 'Mamobi', 'Kanda'] },
      { code: 'AYC', name: 'Ayawaso Central Municipal', towns: ['Kokomlemle', 'Kotobabi', 'Abelenkpe'] },
      { code: 'ABW', name: 'Ablekuma West Municipal', towns: ['Dansoman', 'Mpoase', 'Sahara'] },
      { code: 'ABN', name: 'Ablekuma North Municipal', towns: ['Darkuman', 'Abeka', 'Lapaz'] },
      { code: 'ABC', name: 'Ablekuma Central Municipal', towns: ['Korle Gonno', 'Mamprobi'] },
      { code: 'KWD', name: 'Korle Klottey Municipal', towns: ['Osu', 'Christiansborg', 'Labone', 'Cantonments'] },
    ],
  },
  {
    code: 'AR',
    name: 'Ashanti',
    capital: 'Kumasi',
    districts: [
      { code: 'KMA', name: 'Kumasi Metropolitan', towns: ['Kumasi', 'Adum', 'Bantama', 'Suame', 'Asafo', 'Atonsu', 'Kwadaso', 'Nhyiaeso', 'Tafo'] },
      { code: 'OBA', name: 'Obuasi Municipal', towns: ['Obuasi', 'Tutuka', 'Boete', 'Jimiso'] },
      { code: 'EJA', name: 'Ejisu Municipal', towns: ['Ejisu', 'Besease', 'Juaben', 'Fumesua'] },
      { code: 'MMP', name: 'Mampong Municipal', towns: ['Mampong', 'Kofiase', 'Beposo', 'Nsuta'] },
      { code: 'BEK', name: 'Bekwai Municipal', towns: ['Bekwai', 'Anwiankwanta', 'Amoafo'] },
      { code: 'OFN', name: 'Offinso North', towns: ['Afrancho', 'Nsenua', 'Akumadan'] },
      { code: 'OFS', name: 'Offinso South', towns: ['Offinso', 'Abofour', 'Nkenkasu'] },
      { code: 'ASO', name: 'Asokwa Municipal', towns: ['Asokwa', 'Ahinsan', 'Atonsu'] },
      { code: 'KWB', name: 'Kwadaso Municipal', towns: ['Kwadaso', 'Asuoyeboa', 'Tanoso'] },
      { code: 'OAS', name: 'Old Tafo Municipal', towns: ['Tafo', 'Pankrono', 'Amakom'] },
      { code: 'SUB', name: 'Subin Municipal', towns: ['Adum', 'Fanti New Town', 'Asafo'] },
      { code: 'BOS', name: 'Bosomtwe', towns: ['Kuntanase', 'Jachie', 'Abono'] },
      { code: 'ASK', name: 'Asante Akim North', towns: ['Konongo', 'Odumase', 'Agogo'] },
      { code: 'AAC', name: 'Asante Akim Central', towns: ['Konongo-Odumasi', 'Juansa'] },
      { code: 'AAS', name: 'Asante Akim South', towns: ['Juaso', 'Obogu', 'Bompata'] },
      { code: 'AMN', name: 'Ahafo Ano North', towns: ['Tepa', 'Wioso', 'Maabang'] },
      { code: 'AMS', name: 'Ahafo Ano South East', towns: ['Mankranso', 'Sabronum'] },
      { code: 'AMW', name: 'Ahafo Ano South West', towns: ['Kunsu', 'Mpasaaso'] },
      { code: 'SSK', name: 'Sekyere South', towns: ['Agona', 'Jamasi', 'Asokore'] },
      { code: 'SKE', name: 'Sekyere East', towns: ['Effiduase', 'Asokore', 'Kumawu'] },
      { code: 'SKC', name: 'Sekyere Central', towns: ['Nsuta', 'Beposo', 'Kwamang'] },
      { code: 'AMF', name: 'Amansie Central', towns: ['Jacobu', 'Kokofu', 'Tweapease'] },
      { code: 'AMW2', name: 'Amansie West', towns: ['Manso Nkwanta', 'Manso Adubia'] },
      { code: 'AMS2', name: 'Amansie South', towns: ['Manso Atwere', 'Datano'] },
      { code: 'ADN', name: 'Adansi North', towns: ['Fomena', 'Akrokerri', 'Dompoase'] },
      { code: 'ADS', name: 'Adansi South', towns: ['New Edubiase', 'Bodwesango'] },
      { code: 'ADK', name: 'Adansi Asokwa', towns: ['Obogu', 'Brofoyedru'] },
      { code: 'KSN', name: 'Kwabre East', towns: ['Mamponteng', 'Antoa', 'Adwumakase'] },
      { code: 'AFG', name: 'Afigya Kwabre North', towns: ['Afrancho', 'Nsenua'] },
      { code: 'AFK', name: 'Afigya Kwabre South', towns: ['Kodie', 'Heman'] },
    ],
  },
  {
    code: 'WR',
    name: 'Western',
    capital: 'Sekondi-Takoradi',
    districts: [
      { code: 'STM', name: 'Sekondi-Takoradi Metropolitan', towns: ['Sekondi', 'Takoradi', 'Essikado', 'Effia', 'Anaji', 'Kojokrom'] },
      { code: 'TAR', name: 'Tarkwa-Nsuaem Municipal', towns: ['Tarkwa', 'Nsuaem', 'Aboso', 'Bogoso'] },
      { code: 'PMA', name: 'Prestea-Huni Valley Municipal', towns: ['Prestea', 'Huni Valley', 'Bogoso'] },
      { code: 'SWR', name: 'Shama', towns: ['Shama', 'Inchaban', 'Abuesi'] },
      { code: 'WAS', name: 'Wassa East', towns: ['Daboase', 'Mpohor'] },
      { code: 'WSW', name: 'Wassa Amenfi East', towns: ['Wassa Akropong', 'Asankragwa'] },
      { code: 'WAC', name: 'Wassa Amenfi Central', towns: ['Manso Amenfi', 'Dunkwa'] },
      { code: 'WAW', name: 'Wassa Amenfi West', towns: ['Asankragwa', 'Samreboi'] },
      { code: 'MOR', name: 'Mpohor', towns: ['Mpohor', 'Adum Banso'] },
      { code: 'AHT', name: 'Ahanta West', towns: ['Agona Nkwanta', 'Dixcove', 'Busua', 'Cape Three Points'] },
      { code: 'NZM', name: 'Nzema East Municipal', towns: ['Axim', 'Aiyinase', 'Ankobra'] },
      { code: 'ELL', name: 'Ellembelle', towns: ['Nkroful', 'Esiama', 'Atuabo'] },
      { code: 'JMR', name: 'Jomoro', towns: ['Half Assini', 'Elubo', 'Tikobo'] },
      { code: 'EFM', name: 'Effia Kwesimintsim Municipal', towns: ['Effia', 'Kwesimintsim', 'Apremdo'] },
    ],
  },
  {
    code: 'WN',
    name: 'Western North',
    capital: 'Sefwi Wiawso',
    districts: [
      { code: 'SWS', name: 'Sefwi Wiawso Municipal', towns: ['Sefwi Wiawso', 'Asawinso', 'Boako'] },
      { code: 'SWA', name: 'Sefwi Akontombra', towns: ['Akontombra', 'Sefwi Bekwai'] },
      { code: 'BBW', name: 'Bibiani-Anhwiaso-Bekwai Municipal', towns: ['Bibiani', 'Anhwiaso', 'Sefwi Bekwai'] },
      { code: 'JWS', name: 'Juaboso', towns: ['Juaboso', 'Bonsu Nkwanta'] },
      { code: 'BOD', name: 'Bia East', towns: ['Adabokrom', 'Bia Debiso'] },
      { code: 'BWS', name: 'Bia West', towns: ['Essam', 'Debiso'] },
      { code: 'BDK', name: 'Bodi', towns: ['Bodi', 'Surano', 'Kwakukrom'] },
      { code: 'SBA', name: 'Suaman', towns: ['Dadieso', 'Suaman'] },
    ],
  },
  {
    code: 'CR',
    name: 'Central',
    capital: 'Cape Coast',
    districts: [
      { code: 'CCM', name: 'Cape Coast Metropolitan', towns: ['Cape Coast', 'Abura', 'Pedu', 'Ola', 'Kakumdo'] },
      { code: 'KSM', name: 'Komenda-Edina-Eguafo-Abirem Municipal', towns: ['Elmina', 'Komenda', 'Abrem Agona'] },
      { code: 'MUN', name: 'Mfantsiman Municipal', towns: ['Saltpond', 'Anomabo', 'Abandze', 'Mankessim'] },
      { code: 'AGM', name: 'Agona West Municipal', towns: ['Agona Swedru', 'Agona Nyakrom', 'Agona Nsaba'] },
      { code: 'AGE', name: 'Agona East', towns: ['Agona Nsaba', 'Agona Duakwa'] },
      { code: 'EFM2', name: 'Effutu Municipal', towns: ['Winneba', 'Pomadze', 'Warabeba'] },
      { code: 'GMM', name: 'Gomoa West', towns: ['Apam', 'Gomoa Fetteh', 'Gomoa Dawurampong'] },
      { code: 'GME', name: 'Gomoa East', towns: ['Gomoa Potsin', 'Gomoa Afransi'] },
      { code: 'GMC', name: 'Gomoa Central', towns: ['Gomoa Afransi', 'Gomoa Ojobi'] },
      { code: 'AWM', name: 'Awutu Senya East Municipal', towns: ['Kasoa', 'Awutu', 'Ofaakor', 'Galilea'] },
      { code: 'AWS', name: 'Awutu Senya West', towns: ['Awutu Breku', 'Bontrase'] },
      { code: 'ACM', name: 'Assin Central Municipal', towns: ['Assin Fosu', 'Assin Praso', 'Assin Bereku'] },
      { code: 'ASN', name: 'Assin North', towns: ['Assin Nyankumasi', 'Assin Akropong'] },
      { code: 'ASS', name: 'Assin South', towns: ['Nsuaem', 'Assin Akonfudi'] },
      { code: 'TSW', name: 'Twifo-Atti Morkwa', towns: ['Twifo Praso', 'Twifo Hemang', 'Morkwa'] },
      { code: 'THM', name: 'Twifo Hemang Lower Denkyira', towns: ['Twifo Hemang', 'Wawase'] },
      { code: 'UDW', name: 'Upper Denkyira West', towns: ['Diaso', 'Dunkwa-on-Offin'] },
      { code: 'UDE', name: 'Upper Denkyira East Municipal', towns: ['Dunkwa-on-Offin', 'Kyekyewere'] },
      { code: 'ABU', name: 'Abura Asebu Kwamankese', towns: ['Abura Dunkwa', 'Asebu', 'Moree'] },
    ],
  },
  {
    code: 'ER',
    name: 'Eastern',
    capital: 'Koforidua',
    districts: [
      { code: 'NJM', name: 'New Juaben South Municipal', towns: ['Koforidua', 'Effiduase', 'Jumapo', 'Oyoko'] },
      { code: 'NJN', name: 'New Juaben North Municipal', towns: ['Koforidua-Effiduase', 'Suhyen', 'Akwadum'] },
      { code: 'NSM', name: 'Nsawam-Adoagyiri Municipal', towns: ['Nsawam', 'Adoagyiri', 'Aburi', 'Pakro'] },
      { code: 'ABG', name: 'Akuapem North', towns: ['Akropong', 'Larteh', 'Mampong', 'Mamfe'] },
      { code: 'AKS', name: 'Akuapem South', towns: ['Aburi', 'Kitase', 'Peduase'] },
      { code: 'SSB', name: 'Suhum Municipal', towns: ['Suhum', 'Coaltar', 'Teacher Mante'] },
      { code: 'AYE2', name: 'Ayensuano', towns: ['Coaltar', 'Ayensuano'] },
      { code: 'WES', name: 'West Akim Municipal', towns: ['Asamankese', 'Osenase', 'Adeiso'] },
      { code: 'EAK', name: 'East Akim Municipal', towns: ['Kibi', 'Bunso', 'Apedwa', 'Osiem'] },
      { code: 'BRM', name: 'Birim North', towns: ['New Abirem', 'Afosu', 'Nkawkaw'] },
      { code: 'BRS', name: 'Birim South', towns: ['Akim Oda', 'Akim Swedru', 'Kade'] },
      { code: 'BRC', name: 'Birim Central Municipal', towns: ['Oda', 'Akim Oda', 'Akwatia'] },
      { code: 'DBS', name: 'Denkyembour', towns: ['Akwatia', 'Kade', 'Asuom'] },
      { code: 'ASG', name: 'Asuogyaman', towns: ['Atimpoku', 'Akosombo', 'Senchi'] },
      { code: 'LMN', name: 'Lower Manya Krobo Municipal', towns: ['Odumase Krobo', 'Agormanya', 'Kpong'] },
      { code: 'UMK', name: 'Upper Manya Krobo', towns: ['Asesewa', 'Sekesua'] },
      { code: 'YMK', name: 'Yilo Krobo Municipal', towns: ['Somanya', 'Nkurakan', 'Huhunya'] },
      { code: 'ANM', name: 'Achiase', towns: ['Achiase', 'Akim Achiase'] },
      { code: 'KWH', name: 'Kwahu West Municipal', towns: ['Nkawkaw', 'Obo', 'Pepease'] },
      { code: 'KWE', name: 'Kwahu East', towns: ['Abetifi', 'Pepease', 'Kwahu Tafo'] },
      { code: 'KWS', name: 'Kwahu South', towns: ['Mpraeso', 'Obo', 'Abene'] },
      { code: 'KWA', name: 'Kwahu Afram Plains North', towns: ['Donkorkrom', 'Tease', 'Maame Krobo'] },
      { code: 'KAP', name: 'Kwahu Afram Plains South', towns: ['Tease', 'Forifori'] },
      { code: 'AFD', name: 'Akyemansa', towns: ['Akyem Ofoase', 'Akyem Ayirebi'] },
      { code: 'FAN', name: 'Fanteakwa North', towns: ['Begoro', 'Osino'] },
      { code: 'FAS', name: 'Fanteakwa South', towns: ['Osino', 'Anyinasin'] },
      { code: 'OKR', name: 'Okere', towns: ['Adukrom', 'Mamfe'] },
    ],
  },
  {
    code: 'VR',
    name: 'Volta',
    capital: 'Ho',
    districts: [
      { code: 'HMN', name: 'Ho Municipal', towns: ['Ho', 'Bankoe', 'Dome', 'Sokode'] },
      { code: 'HWT', name: 'Ho West', towns: ['Dzolokpuita', 'Abutia', 'Takla'] },
      { code: 'SHM', name: 'South Dayi', towns: ['Kpeve', 'Peki', 'Vakpo'] },
      { code: 'NDY', name: 'North Dayi', towns: ['Anfoega', 'Kpando Torkor'] },
      { code: 'KPM', name: 'Kpando Municipal', towns: ['Kpando', 'Kpando Torkor', 'Gbefi'] },
      { code: 'KTM', name: 'Ketu South Municipal', towns: ['Aflao', 'Denu', 'Agbozume'] },
      { code: 'KTN', name: 'Ketu North', towns: ['Dzodze', 'Penyi', 'Weta'] },
      { code: 'AVE', name: 'Akatsi South', towns: ['Akatsi', 'Wute', 'Ave Dakpa'] },
      { code: 'AKN', name: 'Akatsi North', towns: ['Ave Dakpa', 'Avenorpeme'] },
      { code: 'SDT', name: 'South Tongu', towns: ['Sogakope', 'Dabala', 'Agave'] },
      { code: 'CTT', name: 'Central Tongu', towns: ['Adidome', 'Mafi Kumase'] },
      { code: 'NTT', name: 'North Tongu', towns: ['Battor', 'Mepe', 'Juapong'] },
      { code: 'ANH', name: 'Anloga', towns: ['Anloga', 'Woe', 'Tegbi'] },
      { code: 'KTT', name: 'Keta Municipal', towns: ['Keta', 'Kedzi', 'Vodza', 'Dzelukope'] },
      { code: 'AGL', name: 'Agotime Ziope', towns: ['Kpetoe', 'Ziope'] },
      { code: 'ADF', name: 'Adaklu', towns: ['Adaklu Waya', 'Adaklu Helekpe'] },
      { code: 'AFP', name: 'Afadzato South', towns: ['Ve Golokwati', 'Liati'] },
    ],
  },
  {
    code: 'OR',
    name: 'Oti',
    capital: 'Dambai',
    districts: [
      { code: 'KNJ', name: 'Krachi Nchumuru', towns: ['Chinderi', 'Borae'] },
      { code: 'KRE', name: 'Krachi East Municipal', towns: ['Dambai', 'Kete Krachi'] },
      { code: 'KRW', name: 'Krachi West', towns: ['Kete Krachi', 'Banda'] },
      { code: 'NKM', name: 'Nkwanta North', towns: ['Kpassa', 'Sibi'] },
      { code: 'NKS', name: 'Nkwanta South Municipal', towns: ['Nkwanta', 'Damanko', 'Kpasa'] },
      { code: 'BJS', name: 'Biakoye', towns: ['Nkonya', 'Worawora'] },
      { code: 'JAP', name: 'Jasikan', towns: ['Jasikan', 'Bodada', 'Guaman'] },
      { code: 'KDJ', name: 'Kadjebi', towns: ['Kadjebi', 'Dodo Amanfrom'] },
    ],
  },
  {
    code: 'NR',
    name: 'Northern',
    capital: 'Tamale',
    districts: [
      { code: 'TAM', name: 'Tamale Metropolitan', towns: ['Tamale', 'Lamashegu', 'Vittin', 'Changli', 'Sakasaka'] },
      { code: 'SAG', name: 'Sagnarigu Municipal', towns: ['Sagnarigu', 'Choggu', 'Gurugu'] },
      { code: 'YND', name: 'Yendi Municipal', towns: ['Yendi', 'Gnani', 'Bimbilla'] },
      { code: 'TOL', name: 'Tolon', towns: ['Tolon', 'Nyankpala'] },
      { code: 'KUM', name: 'Kumbungu', towns: ['Kumbungu', 'Dalun', 'Voggu'] },
      { code: 'SAV', name: 'Savelugu Municipal', towns: ['Savelugu', 'Nanton', 'Diare'] },
      { code: 'NAT', name: 'Nanton', towns: ['Nanton', 'Kpalsogu'] },
      { code: 'MND', name: 'Mion', towns: ['Sang', 'Jimle'] },
      { code: 'GUS', name: 'Gushiegu Municipal', towns: ['Gushiegu', 'Galwei', 'Nabuli'] },
      { code: 'KAR', name: 'Karaga', towns: ['Karaga', 'Pishigu', 'Sung'] },
      { code: 'SBB', name: 'Saboba', towns: ['Saboba', 'Wapuli', 'Sambuli'] },
      { code: 'TAT', name: 'Tatale Sanguli', towns: ['Tatale', 'Sanguli'] },
      { code: 'ZAB', name: 'Zabzugu', towns: ['Zabzugu', 'Tijo', 'Zakpalsi'] },
      { code: 'NNB', name: 'Nanumba North Municipal', towns: ['Bimbilla', 'Chamba', 'Jilo'] },
      { code: 'NNS', name: 'Nanumba South', towns: ['Wulensi', 'Jou', 'Kpabi'] },
    ],
  },
  {
    code: 'SV',
    name: 'Savannah',
    capital: 'Damongo',
    districts: [
      { code: 'WSG', name: 'West Gonja Municipal', towns: ['Damongo', 'Larabanga', 'Mole'] },
      { code: 'CNG', name: 'Central Gonja', towns: ['Buipe', 'Yapei'] },
      { code: 'EGJ', name: 'East Gonja Municipal', towns: ['Salaga', 'Kpalbe', 'Makango'] },
      { code: 'NGJ', name: 'North Gonja', towns: ['Daboya', 'Lingbinsi'] },
      { code: 'NEG', name: 'North East Gonja', towns: ['Kpalbe', 'Kpembe'] },
      { code: 'BLE', name: 'Bole', towns: ['Bole', 'Bamboi', 'Tuna'] },
      { code: 'SWT', name: 'Sawla-Tuna-Kalba', towns: ['Sawla', 'Tuna', 'Kalba'] },
    ],
  },
  {
    code: 'NE',
    name: 'North East',
    capital: 'Nalerigu',
    districts: [
      { code: 'EMN', name: 'East Mamprusi Municipal', towns: ['Gambaga', 'Nalerigu', 'Langbinsi'] },
      { code: 'WMM', name: 'West Mamprusi Municipal', towns: ['Walewale', 'Wungu', 'Janga'] },
      { code: 'MMP2', name: 'Mamprugu Moagduri', towns: ['Yagaba', 'Kubori'] },
      { code: 'BNK', name: 'Bunkpurugu-Nakpanduri', towns: ['Bunkpurugu', 'Nakpanduri', 'Kpemale'] },
      { code: 'YKN', name: 'Yunyoo-Nasuan', towns: ['Yunyoo', 'Nasuan'] },
      { code: 'CHR', name: 'Chereponi', towns: ['Chereponi', 'Sangbana'] },
    ],
  },
  {
    code: 'UE',
    name: 'Upper East',
    capital: 'Bolgatanga',
    districts: [
      { code: 'BLG', name: 'Bolgatanga Municipal', towns: ['Bolgatanga', 'Zuarungu', 'Sumbrungu', 'Gambibgo'] },
      { code: 'BLE2', name: 'Bolgatanga East', towns: ['Zuarungu', 'Nangodi'] },
      { code: 'BON', name: 'Bongo', towns: ['Bongo', 'Soe', 'Namoo'] },
      { code: 'BWK', name: 'Bawku Municipal', towns: ['Bawku', 'Garu', 'Binduri'] },
      { code: 'BWW', name: 'Bawku West', towns: ['Zebilla', 'Tilli'] },
      { code: 'GRU', name: 'Garu', towns: ['Garu', 'Tempane', 'Singo'] },
      { code: 'TMP', name: 'Tempane', towns: ['Tempane', 'Woriyanga'] },
      { code: 'PUS', name: 'Pusiga', towns: ['Pusiga', 'Kulungugu'] },
      { code: 'BND', name: 'Binduri', towns: ['Binduri', 'Bazua'] },
      { code: 'NVR', name: 'Nabdam', towns: ['Nangodi', 'Kongo'] },
      { code: 'TLN', name: 'Talensi', towns: ['Tongo', 'Winkogo', 'Tengzuk'] },
      { code: 'KSN2', name: 'Kassena-Nankana East', towns: ['Navrongo', 'Kologo', 'Paga'] },
      { code: 'KNW', name: 'Kassena-Nankana West', towns: ['Paga', 'Chiana'] },
      { code: 'BKE', name: 'Builsa North', towns: ['Sandema', 'Chuchuliga', 'Wiaga'] },
      { code: 'BKS', name: 'Builsa South', towns: ['Fumbisi', 'Kanjarga'] },
    ],
  },
  {
    code: 'UW',
    name: 'Upper West',
    capital: 'Wa',
    districts: [
      { code: 'WAM', name: 'Wa Municipal', towns: ['Wa', 'Bamahu', 'Kpongu', 'Danko'] },
      { code: 'WAE', name: 'Wa East', towns: ['Funsi', 'Bulenga'] },
      { code: 'WAW', name: 'Wa West', towns: ['Wechiau', 'Dorimon'] },
      { code: 'NAD', name: 'Nadowli-Kaleo', towns: ['Nadowli', 'Kaleo', 'Takpo'] },
      { code: 'DFM', name: 'Daffiama-Bussie-Issa', towns: ['Daffiama', 'Issa', 'Bussie'] },
      { code: 'JRM', name: 'Jirapa Municipal', towns: ['Jirapa', 'Ullo', 'Hain'] },
      { code: 'LBI', name: 'Lambussie-Karni', towns: ['Lambussie', 'Karni', 'Piina'] },
      { code: 'LWA', name: 'Lawra Municipal', towns: ['Lawra', 'Babile', 'Eremon'] },
      { code: 'NKD', name: 'Nandom', towns: ['Nandom', 'Ko', 'Hamile'] },
      { code: 'SSK2', name: 'Sissala East', towns: ['Tumu', 'Bugubelle', 'Kulfuo'] },
      { code: 'SSW', name: 'Sissala West', towns: ['Gwollu', 'Jeffisi', 'Pulima'] },
    ],
  },
  {
    code: 'BR',
    name: 'Bono',
    capital: 'Sunyani',
    districts: [
      { code: 'SYM', name: 'Sunyani Municipal', towns: ['Sunyani', 'New Dormaa', 'Abesim', 'Odumasi'] },
      { code: 'SYW', name: 'Sunyani West', towns: ['Odumasi', 'Fiapre', 'Chiraa'] },
      { code: 'BEE', name: 'Berekum East Municipal', towns: ['Berekum', 'Jinijini', 'Senase'] },
      { code: 'BEW', name: 'Berekum West', towns: ['Jinijini', 'Fetentaa'] },
      { code: 'DMM', name: 'Dormaa Municipal', towns: ['Dormaa Ahenkro', 'Wamfie', 'Nkrankwanta'] },
      { code: 'DME', name: 'Dormaa East', towns: ['Wamfie', 'Asuotiano'] },
      { code: 'DMW', name: 'Dormaa West', towns: ['Nkrankwanta', 'Kwakuanya'] },
      { code: 'JMN', name: 'Jaman North', towns: ['Sampa', 'Suma Ahenkro'] },
      { code: 'JMS', name: 'Jaman South Municipal', towns: ['Drobo', 'Bofourkrom', 'Japekrom'] },
      { code: 'TNK', name: 'Tain', towns: ['Nsawkaw', 'Seikwa', 'Badu'] },
      { code: 'WCH', name: 'Wenchi Municipal', towns: ['Wenchi', 'Akrobi', 'Subinso'] },
    ],
  },
  {
    code: 'BE',
    name: 'Bono East',
    capital: 'Techiman',
    districts: [
      { code: 'TCM', name: 'Techiman Municipal', towns: ['Techiman', 'Tuobodom', 'Hansua'] },
      { code: 'TCN', name: 'Techiman North', towns: ['Tuobodom', 'Offuman', 'Krobo'] },
      { code: 'NKR', name: 'Nkoranza North', towns: ['Busunya', 'Fiema', 'Bomaa'] },
      { code: 'NKS', name: 'Nkoranza South Municipal', towns: ['Nkoranza', 'Donkro Nkwanta'] },
      { code: 'KTG', name: 'Kintampo North Municipal', towns: ['Kintampo', 'Babato', 'Jema'] },
      { code: 'KTS', name: 'Kintampo South', towns: ['Jema', 'Amoma'] },
      { code: 'ATB', name: 'Atebubu-Amantin Municipal', towns: ['Atebubu', 'Amantin', 'Fakwasi'] },
      { code: 'SNJ', name: 'Sene East', towns: ['Kajaji', 'Kwame Danso'] },
      { code: 'SNW', name: 'Sene West', towns: ['Kwame Danso', 'Bassa'] },
      { code: 'PRU', name: 'Pru East', towns: ['Yeji', 'Prang', 'Abease'] },
      { code: 'PRW', name: 'Pru West', towns: ['Prang', 'Konkoma'] },
    ],
  },
  {
    code: 'AH',
    name: 'Ahafo',
    capital: 'Goaso',
    districts: [
      { code: 'ASD', name: 'Asunafo South', towns: ['Kukuom', 'Abuom'] },
      { code: 'ASN2', name: 'Asunafo North Municipal', towns: ['Goaso', 'Mim', 'Akrodie'] },
      { code: 'ANT', name: 'Asutifi North', towns: ['Kenyasi', 'Kenyasi No. 2', 'Wamahinso'] },
      { code: 'AST', name: 'Asutifi South', towns: ['Hwidiem', 'Acherensua'] },
      { code: 'TNO', name: 'Tano North Municipal', towns: ['Duayaw Nkwanta', 'Tanoso', 'Bomaa'] },
      { code: 'TNS', name: 'Tano South Municipal', towns: ['Bechem', 'Techimantia', 'Derma'] },
    ],
  },
];

// Helper function to get all regions as options
export function getRegionOptions(): { value: string; label: string }[] {
  return GHANA_REGIONS.map((region) => ({
    value: region.code,
    label: region.name,
  }));
}

// Helper function to get districts for a region
export function getDistrictOptions(regionCode: string): { value: string; label: string }[] {
  const region = GHANA_REGIONS.find((r) => r.code === regionCode);
  if (!region) return [];
  return region.districts.map((district) => ({
    value: district.code,
    label: district.name,
  }));
}

// Helper function to get towns for a district
export function getTownOptions(regionCode: string, districtCode: string): { value: string; label: string }[] {
  const region = GHANA_REGIONS.find((r) => r.code === regionCode);
  if (!region) return [];
  const district = region.districts.find((d) => d.code === districtCode);
  if (!district) return [];
  return district.towns.map((town) => ({
    value: town,
    label: town,
  }));
}

// Get region name from code
export function getRegionName(code: string): string {
  return GHANA_REGIONS.find((r) => r.code === code)?.name || code;
}

// Get district name from code
export function getDistrictName(regionCode: string, districtCode: string): string {
  const region = GHANA_REGIONS.find((r) => r.code === regionCode);
  return region?.districts.find((d) => d.code === districtCode)?.name || districtCode;
}
