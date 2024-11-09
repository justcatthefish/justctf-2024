var esprima = require('esprima');
var escodegen = require('escodegen');

var scope = [{ id: 0, variables: {} }]

function enterScope() {
    scope.push({ id: 0, variables: {} })
}

function exitScope() {
    scope.pop()
}


function getLocalId(name) {
    for (var localScope of [...scope].reverse()) {
        if (localScope.variables[name] != undefined) {
            return [scope.indexOf(localScope), localScope.variables[name]]
        }
    }
    return;
}

function makeLocalId(name) {
    if (scope.length == 0) return;
    var localScope = scope.at(-1);
    if (localScope.variables[name]) {
        return localScope.variables[name]
    }
    localScope.variables[name] = localScope.id++
    return scope[name]
}


function createScopeExpression(push, returnExpr) {
    return ({
        "type": "ExpressionStatement",
        "expression": {
            "type": "AssignmentExpression",
            "operator": "=",
            "left": {
                "type": "MemberExpression",
                "computed": true,
                "object": {
                    "type": "MemberExpression",
                    "computed": true,
                    "object": {
                        "type": "MemberExpression",
                        "computed": true,
                        "object": {
                            "type": "Identifier",
                            "name": "d"
                        },
                        "property": {
                            "type": "Literal",
                            "value": scope.length - 1,
                            "raw": "1"
                        }
                    },
                    "property": {
                        "type": "Literal",
                        "value": push ? 1 : 2,
                        "raw": "2"
                    }
                },
                "property": {
                    "type": "Literal",
                    "value": !push ? 10 : 0,
                    "raw": "3"
                }
            },
            "right": returnExpr ? returnExpr : (push ? {
                "type": "Literal",
                "value": ~~(Math.random() * 10),
                "raw": "1"
            } : {
                "type": "Identifier",
                "name": "undefined"
            })
        }
    })
}


function createLocalExpression(name) {
    var local = getLocalId(name);
    if (local == undefined) {
        return ({
            "type": "Identifier",
            "name": name
        })
    }
    var [scopeId, localId] = local;

    return ({
        "type": "MemberExpression",
        "computed": true,
        "object": {
            "type": "MemberExpression",
            "computed": true,
            "object": {
                "type": "MemberExpression",
                "computed": true,
                "object": {
                    "type": "Identifier",
                    "name": "d"
                },
                "property": {
                    "type": "Literal",
                    "value": scopeId,
                    "raw": "1"
                }
            },
            "property": {
                "type": "Literal",
                "value": 0,
                "raw": "2"
            }
        },
        "property": {
            "type": "Literal",
            "value": localId,
            "raw": "3"
        }
    })
}



var nodes = [];
function visit(node, key) {

    lastNode = node;
    if (typeof node != "object") return node

    if (node == undefined) return node
    if (node.type == "FunctionExpression") {
        enterScope()
        var pushExpr = createScopeExpression(true)
        var popExpr = createScopeExpression(false)

        var args = []
        var i = 0;
        for (var argument of node.params) {
            makeLocalId(argument.name)
            args.push({
                "type": "ExpressionStatement",
                "expression": {
                    "type": "AssignmentExpression",
                    "operator": "=",
                    "left": createLocalExpression(argument.name),
                    "right": {
                        "type": "MemberExpression",
                        "computed": true,
                        "object": {
                            "type": "Identifier",
                            "name": "arguments"
                        },
                        "property": {
                            "type": "Literal",
                            "value": i++,
                            "raw": "0"
                        }
                    }
                }
            })
        }
        node.params = []
        var xd = false
        if (!node.body.body.at(-1) || node.body.body.at(-1).type != "ReturnStatement") {
            xd = true;
        }

        for (var key in node.body.body) {
            node.body.body[key] = visit(node.body.body[key], key)
        }
        if (xd) {
            node.body.body = [...node.body.body, popExpr]
        }
        node.body.body = [pushExpr, ...args, ...node.body.body]

        exitScope()
        return node;
    }

    if (node.type == "ReturnStatement") {

        for (var key in node) {
            node[key] = visit(node[key], key)
        }


        node.argument = {
            "type": "SequenceExpression",
            "expressions": [
                {
                    "type": "AssignmentExpression",
                    "operator": "=",
                    "left": {
                        "type": "Identifier",
                        "name": "tmp"
                    },
                    "right": (node.argument == undefined ? ({
                        "type": "Identifier",
                        "name": "undefined"
                    }) : node.argument)
                },
                createScopeExpression(false, {
                    "type": "Identifier",
                    "name": "tmp"
                }).expression
            ]
        }
        return node
    }

    if (node.type == "VariableDeclaration") {
        if (node.declarations.length > 1) throw "unsupported multiple variables"
        makeLocalId(node.declarations[0].id.name)
        node.declarations[0].init = visit(node.declarations[0].init, "init")
        if (node.declarations[0].init == undefined) console.log("diffa")
        if (key == "init") {
            return {
                "type": "AssignmentExpression",
                "operator": "=",
                "left": createLocalExpression(node.declarations[0].id.name),
                "right": (node.declarations[0].init == undefined ? ({
                    "type": "Identifier",
                    "name": "undefined"
                }) : node.declarations[0].init)
            }
        }
        return {
            "type": "ExpressionStatement",
            "expression": {
                "type": "AssignmentExpression",
                "operator": "=",
                "left": createLocalExpression(node.declarations[0].id.name),
                "right": (node.declarations[0].init == undefined ? ({
                    "type": "Identifier",
                    "name": "undefined"
                }) : node.declarations[0].init)
            }
        }
    }
    if (node.type == "Identifier") {
        if (!(nodes.at(-1).type == "MemberExpression" && key == "property" && nodes.at(-1).computed == false)) {
            return createLocalExpression(node.name);
        }

    }

    if (node.type == "FunctionDeclaration") {
        makeLocalId(node.id.name)
        var expr = createLocalExpression(node.id.name);
        enterScope()
        var args = []
        var i = 0;
        for (var argument of node.params) {
            makeLocalId(argument.name)
            args.push({
                "type": "ExpressionStatement",
                "expression": {
                    "type": "AssignmentExpression",
                    "operator": "=",
                    "left": createLocalExpression(argument.name),
                    "right": {
                        "type": "MemberExpression",
                        "computed": true,
                        "object": {
                            "type": "Identifier",
                            "name": "arguments"
                        },
                        "property": {
                            "type": "Literal",
                            "value": i++,
                            "raw": "0"
                        }
                    }
                }
            })
        }

        var pushExpr = createScopeExpression(true)
        var popExpr = createScopeExpression(false)


        var xd = false
        if (!node.body.body.at(-1) || node.body.body.at(-1).type != "ReturnStatement") {
            xd = true;
        }
        for (var key in node.body.body) {
            node.body.body[key] = visit(node.body.body[key], key)
        }

        if (xd) {
            node.body.body = [...node.body.body, popExpr]
        }

        node.body.body = [pushExpr, ...args, ...node.body.body]

        var node = {
            "type": "ExpressionStatement",
            "expression": {
                "type": "AssignmentExpression",
                "operator": "=",
                "left": expr,
                "right": {
                    "type": "FunctionExpression",
                    "id": null,
                    "params": [],
                    "body": node.body,
                    "generator": node.generator,
                    "expression": node.expression,
                    "async": node.async
                }
            }
        }
        exitScope()
        return node
    }


    for (var key in node) {
        nodes.push(node)
        node[key] = visit(node[key], key)
        nodes.pop()
    }
    return node


}
var fs = require('fs')

fs.writeFileSync('localobf.js', `d[0][1][0]=3\n` + escodegen.generate(visit(esprima.parseScript(fs.readFileSync('callobf.js').toString()))))