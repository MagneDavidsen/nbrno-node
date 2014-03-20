/** @jsx React.DOM */

require.config({
    baseUrl: "/js/lib",
    paths: { 
        'react': ['//cdnjs.cloudflare.com/ajax/libs/react/0.9.0/react.min', 'react/react'],
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

    		rest({ method: 'POST', path: "/api/Vote" , entity: JSON.stringify({side:rapperSide})}).then(function(response) {
    			var entity = JSON.parse(response.entity);
    			var wins = entity.wins;
    			var losses = entity.losses;
				rapperBox.setState({voted:true, wins:wins, losses:losses});
				setTimeout(function(){
					rapperBox.setState({voted: false});

					
				resetVoteView();
				resetListView();
					
					} ,2000);


			});
  		},

		render: function() {
			console.log("rendering rapperbox");

			var notVotedBox = (
				<div className="rapperBox" onClick={this.handleClick}>
					<img src={"data:" +this.props.picture.contentType + ";base64," + this.props.picture.data}  />
					<div className="rapperName">{this.props.rapperName}</div>
				</div>
				);

			var votedBox = (
				<div className="rapperBox">
					<div className="rapperName">{this.props.rapperName}</div>
					<div>Seire: {this.state.wins}</div>
					<div>Tap: {this.state.losses}</div>
				</div>
				);

			return this.state.voted ? votedBox : notVotedBox;
		}
	});


	var RappersView = React.createClass({
		render: function() {
			var leftRapper = this.props.data.left;
			var rightRapper = this.props.data.right;
				
			return (
				<div className="voteBox">
				<RapperBox picture={leftRapper.picture} rapperName={leftRapper.name} side="left"></RapperBox>
				<RapperBox picture={rightRapper.picture} rapperName={rightRapper.name} side="right"></RapperBox>
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
