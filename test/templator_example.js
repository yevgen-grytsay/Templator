var data = {
	albums: [
		{name: 'Golden Heart',				year: '1996'},
		{name: 'A Night In London',			year: '1996'},
		{name: 'Sailing to Philadelphia',	year: '2000'},
		{name: 'The Ragpicker\'s Dream',		year: '2002'},
		{name: 'Shangri-La',				year: '2004', selected: true},
		{name: 'One Take Radio Sessions',	year: '2005'},
		{name: 'Kill To Get Crimson',		year: '2007'},
		{name: 'Get Lucky',					year: '2009'}
	],
	
	shortbio: 'Марк Фройдер Нопфлер OBE (англ. Mark Freuder Knopfler; 12 августа 1949, Глазго, Шотландия)' +
		' — британский рок-музыкант, певец и композитор, один из сооснователей группы Dire Straits.'
};

var template = document.getElementById('template_example').innerHTML;

document.write(templator.wrap(template, data));