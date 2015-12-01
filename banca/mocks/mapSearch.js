function mockByBounds(ne, sw, qt) {
	var natureza = ['perdido', 'encontrado'];
	var especie = ['cachorro', 'gato'];
	var genero = ['macho', 'femea'];
	
	var result = [];
	
	for(var c = 1; c <= qt; c++) {
		result.push({
			natureza: natureza[Math.round(Math.random())],
			especie: especie[Math.round(Math.random())],
			genero: genero[Math.round(Math.random())],
			latitude: Math.random() * (ne.latitude - sw.latitude) + sw.latitude,
			longitude: Math.random() * (ne.longitude - sw.longitude) + sw.longitude
		});
	}
	
	return result;
}