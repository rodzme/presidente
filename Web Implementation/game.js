class Carta 
{
	constructor(naipe, rank, valor) 
	{
        this.naipe = naipe;
        this.rank = rank;
        this.valor = valor;
    }
}

class Baralho 
{
	constructor() 
	{
        this.cartas = [];
	}
	    
	criarBaralho() 
	{
        let naipes = ['clubs', 'diamonds', 'hearts', 'spades'];
        let ranks = ['3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A', '2'];
		let valores = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13];
		
		for (let i = 0; i < naipes.length; i++) 
		{
			for (let j = 0; j < ranks.length; j++) 
			{
                this.cartas.push(new Carta(naipes[i], ranks[j], valores[j]));
            }
        }
	}
	
	shuffle()
	{
	   let location1, location2, tmp;
	   
	   for (let i = 0; i < 1000; i++) 
	   {
           location1 = Math.floor((Math.random() * this.cartas.length));
		   location2 = Math.floor((Math.random() * this.cartas.length));
		   
		   tmp = this.cartas[location1];
		   
           this.cartas[location1] = this.cartas[location2];
           this.cartas[location2] = tmp;
        }
    }
}

class Jogador 
{
	constructor(nome) 
	{
        this.nomeJogador = nome;
        this.cartasJogador = [];
    }
}

class Mesa 
{
	constructor() 
	{
        this.cartasNaMetade = [];
        this.jogadores = [];
	}
	
	start(jogador1, jogador2, jogador3, jogador4) 
	{
		if (jogador1.Jogador == null)
		{
			this.jogadores.push(new Jogador(jogador1));
			this.jogadores.push(new Jogador(jogador2));
			this.jogadores.push(new Jogador(jogador3));
			this.jogadores.push(new Jogador(jogador4));

			this.renderizarBaralho();
		}	
	}
	
	renderizarBaralho()
	{
		let b = new Baralho();
		
		b.criarBaralho();
		b.shuffle();

        this.jogadores[0].cartasJogador = b.cartas.slice(0, 13);
		this.jogadores[1].cartasJogador = b.cartas.slice(13, 26);
		this.jogadores[2].cartasJogador = b.cartas.slice(26, 39);
		this.jogadores[3].cartasJogador = b.cartas.slice(39, 52);
		
		document.getElementById('deck1').innerHTML = '';
		document.getElementById('deck2').innerHTML = '';
		document.getElementById('deck3').innerHTML = '';
		document.getElementById('deck4').innerHTML = '';

		for(var i = 0; i < this.jogadores[0].cartasJogador.length; i++)
		{
			var card = document.createElement("div");
			card.className = "card_" + this.jogadores[0].cartasJogador[i].naipe;
			card.id = "card_" + this.jogadores[0].cartasJogador[i].rank + this.jogadores[0].cartasJogador[i].naipe;
			card.innerHTML = this.jogadores[0].cartasJogador[i].rank;
			card.setAttribute("data-valor", this.jogadores[0].cartasJogador[i].valor)
			
			document.getElementById("deck1").appendChild(card);
		}

		for(var i = 0; i < this.jogadores[1].cartasJogador.length; i++)
		{
			var card = document.createElement("div");
			card.className = "card_" + this.jogadores[1].cartasJogador[i].naipe;
			card.id = "card_" + this.jogadores[1].cartasJogador[i].rank + this.jogadores[1].cartasJogador[i].naipe;
			card.innerHTML = this.jogadores[1].cartasJogador[i].rank;
			card.setAttribute("data-valor", this.jogadores[1].cartasJogador[i].valor)

			document.getElementById("deck2").appendChild(card);
		}

		for(var i = 0; i < this.jogadores[2].cartasJogador.length; i++)
		{
			var card = document.createElement("div");
			card.className = "card_" + this.jogadores[2].cartasJogador[i].naipe;
			card.id = "card_" + this.jogadores[2].cartasJogador[i].rank + this.jogadores[2].cartasJogador[i].naipe;
			card.innerHTML = this.jogadores[2].cartasJogador[i].rank;
			card.setAttribute("data-valor", this.jogadores[2].cartasJogador[i].valor)

			document.getElementById("deck3").appendChild(card);
		}

		for(var i = 0; i < this.jogadores[3].cartasJogador.length; i++)
		{
			var card = document.createElement("div");
			card.className = "card_" + this.jogadores[3].cartasJogador[i].naipe;
			card.id = "card_" + this.jogadores[3].cartasJogador[i].rank + this.jogadores[3].cartasJogador[i].naipe;
			card.innerHTML = this.jogadores[3].cartasJogador[i].rank;
			card.setAttribute("data-valor", this.jogadores[3].cartasJogador[i].valor)

			document.getElementById("deck4").appendChild(card);
		}
	}
}

function novoJogo(a, b, c, d)
{
	let novoJogo = new Mesa();
	novoJogo.start(a, b, c, d);
	//console.log(novoJogo.jogadores);

	var zindex = 1;
	var cartaJogada = 0;
	var rodada = 0;
	var winner = 0;

	document.getElementById('numerorodada').innerHTML = (rodada+1).toString() + "o turno";

	document.getElementById("passarRodada").addEventListener("click", function(e)
	{
		if (rodada < 3)
		{
			rodada++;
			document.getElementById('numerorodada').innerHTML = (rodada+1).toString() + "o turno";
		}
			
		else
		{
			rodada = 0;
			cartaJogada = 0;
			document.getElementById('numerorodada').innerHTML = (rodada+1).toString() + "o turno";
		}
	});

	document.getElementById("deck1").addEventListener("click", function(e)
	{
		if (rodada == 0)
		{	
			var carta = document.getElementById(e.target.id);
			var location_x = Math.floor((Math.random() * 5) + 40);
			var location_y = Math.floor((Math.random() * 5) + 35);
			var posx = "";
			var posy = "";
	
			if (cartaJogada == 0)
			{
				carta.style.position = "absolute";
				carta.style.left = posx.concat(location_x.toString(), "%");
				carta.style.top = posy.concat(location_y.toString(), "%");
				carta.style.zIndex = zindex.toString();
	
				zindex++;
				winner = 0;
	
				cartaJogada = parseInt(document.getElementById(e.target.id).getAttribute("data-valor"));

				if (rodada < 3)
				{
					rodada++;
				}
				else
				{
					rodada = winner;
					cartaJogada = 0;
				}
				
				document.getElementById('numerorodada').innerHTML = (rodada+1).toString() + "o turno";
			}
			
			else if (parseInt(document.getElementById(e.target.id).getAttribute("data-valor")) > cartaJogada)
			{
				carta.style.position = "absolute";
				carta.style.left = posx.concat(location_x.toString(), "%");
				carta.style.top = posy.concat(location_y.toString(), "%");
				carta.style.zIndex = zindex.toString();
				
				zindex++;
				winner = 0;
				
				cartaJogada = parseInt(document.getElementById(e.target.id).getAttribute("data-valor"));

				if (rodada < 3)
				{
					rodada++;
				}
				else
				{
					rodada = winner;
					cartaJogada = 0;
				}

				document.getElementById('numerorodada').innerHTML = (rodada+1).toString() + "o turno";
			}

			else if (parseInt(document.getElementById(e.target.id).getAttribute("data-valor")) <= cartaJogada)
			{
				rodada = rodada;
				document.getElementById('numerorodada').innerHTML = (rodada+1).toString() + "o turno";
			}			
		}	
	});
	
	document.getElementById("deck2").addEventListener("click", function(e){		
		if (rodada == 1)
		{
			var carta = document.getElementById(e.target.id);
			var location_x = Math.floor((Math.random() * 5) + 40);
			var location_y = Math.floor((Math.random() * 5) + 35);
			var posx = "";
			var posy = "";

			if (cartaJogada == 0)
			{
				carta.style.position = "absolute";
				carta.style.left = posx.concat(location_x.toString(), "%");
				carta.style.top = posy.concat(location_y.toString(), "%");
				carta.style.zIndex = zindex.toString();

				zindex++;
				winner = 1;

				cartaJogada = parseInt(document.getElementById(e.target.id).getAttribute("data-valor"));

				if (rodada < 3)
				{
					rodada++;
				}
				else
				{
					rodada = winner;
					cartaJogada = 0;
				}

				document.getElementById('numerorodada').innerHTML = (rodada+1).toString() + "o turno";
			}
			
			else if (parseInt(document.getElementById(e.target.id).getAttribute("data-valor")) > cartaJogada)
			{
				carta.style.position = "absolute";
				carta.style.left = posx.concat(location_x.toString(), "%");
				carta.style.top = posy.concat(location_y.toString(), "%");
				carta.style.zIndex = zindex.toString();

				zindex++;
				winner = 1;

				cartaJogada = parseInt(document.getElementById(e.target.id).getAttribute("data-valor"));

				if (rodada < 3)
				{
					rodada++;
				}
				else
				{
					rodada = winner;
					cartaJogada = 0;
				}

				document.getElementById('numerorodada').innerHTML = (rodada+1).toString() + "o turno";
			}

			else if (parseInt(document.getElementById(e.target.id).getAttribute("data-valor")) <= cartaJogada)
			{
				rodada = rodada;
				document.getElementById('numerorodada').innerHTML = (rodada+1).toString() + "o turno";
			}
		}
	});

	document.getElementById("deck3").addEventListener("click", function(e){
		if (rodada == 2)
		{
			var carta = document.getElementById(e.target.id);
			var location_x = Math.floor((Math.random() * 5) + 40);
			var location_y = Math.floor((Math.random() * 5) + 35);
			var posx = "";
			var posy = "";
	
			if (cartaJogada == 0)
			{
				carta.style.position = "absolute";
				carta.style.left = posx.concat(location_x.toString(), "%");
				carta.style.top = posy.concat(location_y.toString(), "%");
				carta.style.zIndex = zindex.toString();
	
				zindex++;
				winner = 2;
	
				cartaJogada = parseInt(document.getElementById(e.target.id).getAttribute("data-valor"));

				if (rodada < 3)
				{
					rodada++;
				}
				else
				{
					rodada = winner;
					cartaJogada = 0;
				}

				document.getElementById('numerorodada').innerHTML = (rodada+1).toString() + "o turno";
			}
			
			else if (parseInt(document.getElementById(e.target.id).getAttribute("data-valor")) > cartaJogada)
			{
				carta.style.position = "absolute";
				carta.style.left = posx.concat(location_x.toString(), "%");
				carta.style.top = posy.concat(location_y.toString(), "%");
				carta.style.zIndex = zindex.toString();
	
				zindex++;
				winner = 2;

				cartaJogada = parseInt(document.getElementById(e.target.id).getAttribute("data-valor"));

				if (rodada < 3)
				{
					rodada++;
				}
				else
				{
					rodada = winner;
					cartaJogada = 0;
				}

				document.getElementById('numerorodada').innerHTML = (rodada+1).toString() + "o turno";
			}

			else if (parseInt(document.getElementById(e.target.id).getAttribute("data-valor")) <= cartaJogada)
			{
				rodada = rodada;
				document.getElementById('numerorodada').innerHTML = (rodada+1).toString() + "o turno";
			}
		}
	});

	document.getElementById("deck4").addEventListener("click", function(e){
		if (rodada == 3)
		{
			var carta = document.getElementById(e.target.id);
			var location_x = Math.floor((Math.random() * 5) + 40);
			var location_y = Math.floor((Math.random() * 5) + 35);
			var posx = "";
			var posy = "";
	
			if (cartaJogada == 0)
			{
				carta.style.position = "absolute";
				carta.style.left = posx.concat(location_x.toString(), "%");
				carta.style.top = posy.concat(location_y.toString(), "%");
				carta.style.zIndex = zindex.toString();
	
				zindex++;
	
				cartaJogada = parseInt(document.getElementById(e.target.id).getAttribute("data-valor"));

				rodada = 0;
				cartaJogada = 0;
				
				document.getElementById('numerorodada').innerHTML = (rodada+1).toString() + "o turno";
			}
			
			else if (parseInt(document.getElementById(e.target.id).getAttribute("data-valor")) > cartaJogada)
			{
				carta.style.position = "absolute";
				carta.style.left = posx.concat(location_x.toString(), "%");
				carta.style.top = posy.concat(location_y.toString(), "%");
				carta.style.zIndex = zindex.toString();
	
				zindex++;
				winner = 3;

				cartaJogada = parseInt(document.getElementById(e.target.id).getAttribute("data-valor"));

				rodada = winner;
				cartaJogada = 0;

				document.getElementById('numerorodada').innerHTML = (rodada+1).toString() + "o turno";
			}

			else if (parseInt(document.getElementById(e.target.id).getAttribute("data-valor")) <= cartaJogada)
			{
				rodada = rodada;
				document.getElementById('numerorodada').innerHTML = (rodada+1).toString() + "o turno";
			}
		}
	});
}