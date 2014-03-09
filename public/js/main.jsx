/** @jsx React.DOM */

require.config({
	baseUrl: "/js/lib",
	paths: {
		"when": "when/when"
	}
});

require(["rest/rest","rest/interceptor/mime", "react/react"], function(rest,mime,React) {
	rest('http://localhost:8080/api/Rappers/tworandom').then(function(response) {
		console.log('response: ', response);
		
		React.renderComponent(
			<CommentBox data={JSON.parse(response.entity)}/>,
			document.getElementById('content'));
	});

	var Comment = React.createClass({
		render: function() {
			return (
				<div className="comment">
				<h2 className="commentAuthor">
				{this.props.author}
				</h2>
				{this.props.children}
				</div>
				);
		}
	});

	var CommentList = React.createClass({
		render: function() {
			console.log("In commentlist: " + this.props.data);


			var commentNodes = this.props.data.map(function (rapper) {

			 	return <Comment author={rapper.name}>HEY</Comment>;
			 });
			return (
				<div className="commentList">
				{commentNodes}
				</div>
				);
		}
	});

	var CommentForm = React.createClass({
		render: function() {
			return (
				<div className="commentForm">
				Hello, world! I am a CommentForm.
				</div>
				);
		}
	});
	var CommentBox = React.createClass({
		render: function() {
			console.log("In commentbox: " + this.props.data);
			return (
				<div className="commentBox">
				<h1>Comments</h1>
				<CommentList data={this.props.data} />
				<CommentForm />
				</div>
				);
		}
	});



	

});