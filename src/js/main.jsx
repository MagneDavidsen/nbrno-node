/** @jsx React.DOM */

var React = require('react');
require('react/addons');
var Q = require('q');
var $ = require('jquery');

function getTwoRandomRappersPromise() {
      return Q($.ajax({
      type: "GET",
      url: "/api/Rappers/tworandom",
      contentType: "application/json; charset=utf-8",
      dataType: "json"
    }));
}

function getTwoRandomRappersAndThen(renderFunction) {
    function renderTwoRandomRappers(rappers) {

        var imgLeft = document.getElementById('leftpic');
        var imgRight = document.getElementById('rightpic');

        function setImagesAndRender() {
            console.log("both images loaded");
            rappers.left.image = imgLeft;
            rappers.right.image = imgRight;
            renderFunction(rappers);
        }

        imgLeft.onload = function () {
            console.log("imgLeft loaded");
            if (imgRight.complete) {
                setImagesAndRender();
            }
        };

        imgRight.onload = function () {
            console.log("imgRight loaded");
            if (imgLeft.complete) {
                setImagesAndRender();
            }
        };

        setTimeout(function () {
            imgLeft.src = "pictures/" + rappers.left.picture.fileName;
            imgRight.src = "pictures/" + rappers.right.picture.fileName;
        }, 500);
    }

    function handleTwoRandomRappersError(response) {
        console.error('getTwoRandomRappersError: ', JSON.stringify(response));
        //wait 500ms before trying again
        setTimeout(function () {
            getTwoRandomRappersAndThen(renderFunction);
        }, 1000);
    }

    //getTwoRandomRappers
    var twoRandomPromise = getTwoRandomRappersPromise();

    //whenNewRappersReturnRender, else handle error
    twoRandomPromise.then(renderTwoRandomRappers, handleTwoRandomRappersError);
}

function resetListView() {
    function getRappers(url) {
        return Q($.ajax({
        type: "GET",
        url: url,
        contentType: "application/json; charset=utf-8",
        dataType: "json"
      }));
    }

    getRappers("/api/Rappers").then(function(response){
      React.renderComponent(
          <RapperList data={response} listName="Norges beste rapper"/>,
          document.getElementById('allRappers'));
    });

    getRappers("/api/Rappers/month").then(function(response){
      React.renderComponent(
          <RapperList data={response} listName="Månedens beste rapper"/>,
          document.getElementById('monthRappers'));
    });

    getRappers("/api/Rappers/week").then(function(response){
      React.renderComponent(
          <RapperList data={response} listName="Ukas beste rapper"/>,
          document.getElementById('weekRappers'));
    });
}

function resetVoteView(rappers) {
    React.renderComponent(
        <VoteView data={rappers} />,
        document.getElementById('voteView'));
}

function initVoteView(response) {
    React.renderComponent(
        <VoteView data={response} />,
        document.getElementById('voteView'));

}

var RapperListModule = React.createClass({
    render: function () {
        return (
            <div>
                <div className="rapperLists" >
                    <div className="rapperListModule" id="allRappers" />
                    <div className="rapperListModule" id="monthRappers" />
                    <div className="rapperListModule" id="weekRappers" />
                </div>
                <div className="rapperLists" >
                    <div className="rapperListModule">
                        <div className="header">Tips?</div>
                        <a href="http://twitter.com/hiphopograp" target="_blank">
                            <div className="listItem" >@hiphopograp</div>
                        </a>
                    </div>
                </div>
            </div>);
    }
});

var RapperList = React.createClass({
    render: function () {
        var rappers = this.props.data.map(function (rapper, i) {
            return (<div className="listItem">{i + 1}. {rapper.name}</div>);
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
    getInitialState: function () {
        return {voted: false};

    },

    handleClick: function (event) {
        var rapperSide = this.props.side;
        var rapperBox = this;

        function handleVotingFailed(response) {
            console.error('vote error: ', JSON.stringify(response));
        }

        function whenPicturesAreLoadedfadeInAndMakeClickable(rappers) {
            console.log("show view");

            rapperBox.props.updateReloading(false);
            rapperBox.setState({voted: false});

            resetVoteView(rappers);
        }

        ga('send', 'event', 'votebox', 'click', rapperSide);

        //fadeOut
        rapperBox.props.updateReloading(true);

        //makeBoxes unclickable
        rapperBox.setState({voted: true});

        //sendVote
        client = rest.chain(mime, { mime: 'application/json' }).chain(errorCode);
        var votePromise = client({ method: 'POST', path: "/api/Vote", entity: {side: rapperSide}});

        // //voteReturns
        votePromise.then(function (response) {
            console.log("voted");
        }, handleVotingFailed);

        getTwoRandomRappersAndThen(whenPicturesAreLoadedfadeInAndMakeClickable);
    },

    render: function () {

        console.log("rendering rapperbox");

        var cx = React.addons.classSet;
        var classes = cx({
            'rapperBox': true,
            'no-touch': !Modernizr.touch,
            'reloading': this.props.reloading
        });

        var picId = this.props.side + "pic";

        var imgLoad = (
            <div className={classes} onClick={this.state.voted ? "" : this.handleClick} >
                <img id={picId} src={"pictures/" + this.props.fileName} />
                <div className="rapperName">{this.props.rapperName}</div>
            </div>);

        var img = (
            <div className={classes} onClick={this.state.voted ? "" : this.handleClick} >
                <img id={picId} />
                <div className="rapperName">{this.props.rapperName}</div>
            </div>);

        var picture = document.getElementById(picId);
        console.log(picture);

        return picture ? img : imgLoad;
    }
});

var RappersView = React.createClass({
    getInitialState: function () {
        return {reloading: false};
    },

    setReloading: function (value) {
        this.setState({reloading: value});
    },

    render: function () {
        var leftRapper = this.props.data.left;
        var rightRapper = this.props.data.right;

        return (
            <div className="voteBox">
                <RapperBox updateReloading={this.setReloading} reloading={this.state.reloading} rapperName={leftRapper.name}
                fileName={leftRapper.picture.fileName} side="left" />
                <RapperBox updateReloading={this.setReloading} reloading={this.state.reloading} rapperName={rightRapper.name}
                fileName={rightRapper.picture.fileName} side="right" />
            </div>
            );
    }
});

var VoteView = React.createClass({
    render: function () {
        return (
            <div className="voteView">
                <img className="nbrnoimg" src="styles/nbrlogo.png"/>
                <img className="nbrnoimg" src="styles/nbr.png"/>
                <img className="nbrnoimg" src="styles/nbrlogo.png"/>
                <h2>Hvem er best?</h2>

                <RappersView data={this.props.data} />

            </div>
            );
    }
});

React.renderComponent(
    <RapperListModule />,
    document.getElementById('listView'));

getTwoRandomRappersPromise().then(function (response) {
    console.log(response);
    initVoteView(response);
}, function (response) {
    console.error('getTwoRandomRappersError: ', JSON.stringify(response));
    //wait 1000ms before trying again
    setTimeout(function () {
        getTwoRandomRappersAndThen(initVoteView);
    }, 1000);
});

resetListView();
