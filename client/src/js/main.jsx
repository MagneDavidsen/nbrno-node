/** @jsx React.DOM */

require.config({
    baseUrl: "/js/lib",
    paths: {
        'react': ['//cdnjs.cloudflare.com/ajax/libs/react/0.9.0/react-with-addons.min', 'react/react'],
        'when': ['//cdnjs.cloudflare.com/ajax/libs/when/2.7.1/when.min', 'when/when']
    }
});

require(["rest/rest", "rest/interceptor/mime", "rest/interceptor/errorCode", "react", "when"], function (rest, mime, errorCode, React, when) {

    function getTwoRandomRappersPromise() {
        client = rest.chain(errorCode);
        return client({ method: 'GET', path: "/api/Rappers/tworandom"})
    }

    function getTwoRandomRappersAndThen(renderFunction) {

        function renderTwoRandomRappers(response) {
            //wait 500ms before rendering
            setTimeout(function () {
                renderFunction(response);
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
        rest('/api/Rappers').then(function (response) {
            React.renderComponent(
                <RapperList data={JSON.parse(response.entity)} listName="Norges beste rapper"/>,
                document.getElementById('allRappers'));
        });

        rest('/api/Rappers/week').then(function (response) {
            React.renderComponent(
                <RapperList data={JSON.parse(response.entity)} listName="Ukens beste rapper"/>,
                document.getElementById('weekRappers'));
        });

        rest('/api/Rappers/month').then(function (response) {
            React.renderComponent(
                <RapperList data={JSON.parse(response.entity)} listName="Månedens beste rapper"/>,
                document.getElementById('monthRappers'));
        });
    }

    function resetVoteView(response) {
        React.renderComponent(
            <VoteView data={JSON.parse(response.entity)} />,
            document.getElementById('voteView'), function(){
                var leftPic = document.getElementById('leftpic');

                leftPic.addEventListener('load', function () {
                    console.log("changed!");
                });

            });
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
                </div>

                );
        }
    });

    var RapperList = React.createClass({
        render: function () {
            var rappers = this.props.data.map(function (rapper, i) {
                return <div className="listItem">{i + 1}. {rapper.name}</div>
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

            function whenPicturesAreLoadedfadeInAndMakeClickable(response) {
                console.log("show view");

                rapperBox.props.updateReloading(false);
                rapperBox.setState({voted: false});

                resetVoteView(response);
            }

            ga('send', 'event', 'votebox', 'click', rapperSide);

            //fadeOut
            rapperBox.props.updateReloading(true);

            //makeBoxes unclickable
            rapperBox.setState({voted: true})

            //sendVote
            client = rest.chain(mime, { mime: 'application/json' }).chain(errorCode);
            var votePromise = client({ method: 'POST', path: "/api/Vote", entity: {side: rapperSide}});

            //voteReturns
            votePromise.then(function (response) {
                console.log("voted")
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

            return (
                <div className={classes} onClick={this.state.voted ? "" : this.handleClick} >
                    <img id={this.props.side + "pic"} src={"pictures/" + this.props.fileName} />
                    <div className="rapperName">{this.props.rapperName}</div>
                </div>
                );
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
                    fileName={rightRapper.picture.fileName} side="right"  />
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

    getTwoRandomRappersPromise().then(resetVoteView, function (response) {
        console.error('getTwoRandomRappersError: ', JSON.stringify(response));
        //wait 500ms before trying again
        setTimeout(function () {
            getTwoRandomRappersAndThen(resetVoteView);
        }, 1000);
    });
    resetListView();
})
;
