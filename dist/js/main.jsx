/** @jsx React.DOM */

require.config({
	baseUrl: "/js/lib",
	paths: {
		"when": "when/when",
		"yo": "when/when"
	}
});

require(["rest/rest","rest/interceptor/mime", "react/react"], function(rest,mime,React) {
	rest('http://localhost:8080/api/Rappers').then(function(response) {
		React.renderComponent(
			<RapperListModule data={JSON.parse(response.entity)}/>,
			document.getElementById('listView'));
	});

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
				return <div className="listItem">{i+1}. {rapper.name}</div>
			});
			return (
				<div className="rapperList">
					<div className="header">{this.props.listName}</div>
				{rappers}
				</div>

				);
		}
	});



	rest('http://localhost:8080/api/Rappers/tworandom').then(function(response) {
		React.renderComponent(
			<VoteView data={JSON.parse(response.entity)}/>,
			document.getElementById('voteView'));
	});

	var RapperBox = React.createClass({
		render: function() {
			return (
				<div className="rapperBox">
				<img src={"data:" +this.props.picture.contentType + ";base64," + this.props.picture.data} />
				<div className="rapperName">{this.props.rapperName}</div>

				</div>
				);
		}
	});


	var RappersView = React.createClass({
		render: function() {
			var rappers = this.props.data.map(function (rapper) {
				return <RapperBox picture={rapper.picture} rapperName={rapper.name}></RapperBox>;
			});
			return (
				<div className="voteBox">
				{rappers}
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
});
