/** @jsx React.DOM */

require.config({
    baseUrl: "/js/lib",
    paths: { 
        'react': ['//cdnjs.cloudflare.com/ajax/libs/react/0.9.0/react-with-addons.min', 'react/react'],
        'when': ['//cdnjs.cloudflare.com/ajax/libs/when/2.7.1/when.min', 'when/when']
    }
});

require(["rest/rest","rest/interceptor/mime", "react"], function(rest,mime,React) {
	
	function resetListView() {
		rest('/api/Rappers').then(function(response) {
			React.renderComponent(
				<RapperListModule data={JSON.parse(response.entity)}/>,
				document.getElementById('listView'));
		});
	}

	function resetVoteView() {
		rest('/api/Rappers/tworandom').then(function(response) {
		React.renderComponent(
			<VoteView data={JSON.parse(response.entity)}/>,
			document.getElementById('voteView'));
		});
	}

	var RapperListModule = React.createClass({
		render: function() {
			return (
				<div className="rapperLists">
					<div className="rapperListModule">
						<RapperList data={this.props.data} listName="Ukens beste rapper" />
					</div>
					<div className="rapperListModule">
						<RapperList data={this.props.data} listName="Månedens beste rapper"/>
					</div>
					<div className="rapperListModule">
						<RapperList data={this.props.data} listName="Norges beste rapper" />
					</div>
				</div>
				);
		}
	});

	var RapperList = React.createClass({
		render: function() {
			var rappers = this.props.data.map(function (rapper, i) {
				return <div className="listItem">{i+1}. {rapper.name} ({rapper.score})</div>
			});
			return (
				<div className="rapperList">
					<div className="header">{this.props.listName}</div>
					{rappers}
				</div>
				);
		}
	});

	var RapperBox = React.createClass({
		getInitialState: function() {
   			return {voted: false};
  		},

		handleClick: function(event) {
			var rapperSide = this.props.side;
			var rapperBox = this;

			client = rest.chain(mime, { mime: 'application/json' });
			client({ method: 'POST', path: "/api/Vote", entity: {side:rapperSide} }).then(function(response) {
    			console.log(response.entity);
    			var wins = response.entity.wins;
    			var losses = response.entity.losses;
    			rapperBox.setState({voted:true, wins:wins, losses:losses});
    			console.log("voted false")
    			rapperBox.props.updateReloading(true);

    			setTimeout(function(){
    				console.log("reset view")
    				rapperBox.props.updateReloading(false);
    				rapperBox.setState({voted: false})
	    				resetVoteView();
	    				resetListView();
    			} ,1000);
    		});
  		},

		render: function() {
			console.log("rendering rapperbox");

			  var cx = React.addons.classSet;
				var classes = cx({
				    'rapperBox': true,
				    'reloading': this.props.reloading
				  });

			var notVotedBox = (
				<div className={classes} onClick={this.handleClick} >
					<img src={"data:" +this.props.picture.contentType + ";base64," + this.props.picture.data} />
					<div className="rapperName">{this.props.rapperName}</div>
				</div>
				);

			var votedBox = (
				<div className={classes}>
					<img src={"data:" +this.props.picture.contentType + ";base64," + this.props.picture.data} > </img>
					<div className="rapperName">{this.props.rapperName}</div>					
				</div>
				);

			return this.state.voted ? votedBox : notVotedBox;
		}
	});


	var RappersView = React.createClass({
		getInitialState: function() {
   			return {reloading: false};
  		},

  		setReloading: function(value) {
  			this.setState({reloading: value});
  		},

		render: function() {
			var leftRapper = this.props.data.left;
			var rightRapper = this.props.data.right;
				
			return (
				<div className="voteBox">
				<RapperBox updateReloading={this.setReloading} reloading={this.state.reloading} picture={leftRapper.picture} rapperName={leftRapper.name} side="left" />
				<RapperBox updateReloading={this.setReloading} reloading={this.state.reloading} picture={rightRapper.picture} rapperName={rightRapper.name} side="right"  />

				</div>
				);
		}
	});

	var VoteView = React.createClass({
		render: function() {
			return (
				<div className="voteView">
				<h1>norgesbesterapper.no</h1>
				<div className="vs">vs</div>
				<RappersView data={this.props.data} />
				</div>
				);
		}
	});

	resetVoteView();
	resetListView();
});
