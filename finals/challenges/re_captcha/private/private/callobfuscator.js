var esprima = require('esprima');
var escodegen = require('escodegen');

var nodes = []

function visit(node, key) {
    
    lastNode = node;
    if (typeof node != "object") return node
    if(node == undefined) return node

    if(node.type == "Literal" && typeof node.value == "string" && (nodes.at(-1).type != "BinaryExpression" )) {
        node = {
            "type": "MemberExpression",
            "computed": true,
            "object": {
              "type": "AssignmentExpression",
              "operator": "=",
              "left": {
                "type": "MemberExpression",
                "computed": true,
                "object": {
                  "type": "Identifier",
                  "name": "callobf"
                },
                "property": {
                  "type": "Literal",
                  "value": 2,
                  "raw": "0"
                }
              },
              "right": {
                "type": "ArrayExpression",
                "elements": node.value.split("").map(a=>({
                    "type": "Literal",
                    "value": a.charCodeAt(0),
                    "raw": "1"
                  }))
              }
            },
            "property": {
              "type": "Literal",
              "value": 0,
              "raw": "0"
            }
          }
    }


    if(node.type == "CallExpression") {
        node = {
            "type": "MemberExpression",
            "computed": true,
            "object": {
              "type": "AssignmentExpression",
              "operator": "=",
              "left": {
                "type": "MemberExpression",
                "computed": true,
                "object": {
                  "type": "Identifier",
                  "name": "callobf"
                },
                "property": {
                  "type": "Literal",
                  "value": 0,
                  "raw": "0"
                }
              },
              "right": {
                "type": "ArrayExpression",
                "elements": [
                    node.callee,
                    node.callee.type == "MemberExpression" ? node.callee.object : ({
                        "type": "Literal",
                        "value": null,
                        "raw": "undefined"
                    }),
                    ...node.arguments
                ]
              }
            },
            "property": {
              "type": "Literal",
              "value": 0,
              "raw": "0"
            }
          }
    }

    if(node.type == "MemberExpression") {
        if(!node.computed) {
            node.computed = true;
            node.property = {
                "type": "Literal",
                "value": node.property.name,
                "raw": "\"a\""
              }
        }
    }


    for (var key in node) {
        nodes.push(node)
        node[key] = visit(node[key], key)
        nodes.pop()
    }

    if(node.type == "AssignmentExpression" && node.left.type == "MemberExpression" && node.operator == "=") {
        node = {
            "type": "MemberExpression",
            "computed": true,
            "object": {
              "type": "AssignmentExpression",
              "operator": "=",
              "left": {
                "type": "MemberExpression",
                "computed": true,
                "object": {
                  "type": "Identifier",
                  "name": "callobf"
                },
                "property": {
                  "type": "Literal",
                  "value": 3,
                  "raw": "0"
                }
              },
              "right": {
                "type": "ArrayExpression",
                "elements": [
                    node.left.object,
                    node.left.property,
                    node.right
                ]
              }
            },
            "property": {
              "type": "Literal",
              "value": 0,
              "raw": "0"
            }
          }
          return node
    }

    if(node.type == "MemberExpression" && nodes.at(-1).type != "AssignmentExpression") {
        node = {
            "type": "MemberExpression",
            "computed": true,
            "object": {
              "type": "AssignmentExpression",
              "operator": "=",
              "left": {
                "type": "MemberExpression",
                "computed": true,
                "object": {
                  "type": "Identifier",
                  "name": "callobf"
                },
                "property": {
                  "type": "Literal",
                  "value": 1,
                  "raw": "0"
                }
              },
              "right": {
                "type": "ArrayExpression",
                "elements": [
                    node.object,
                    node.property
                ]
              }
            },
            "property": {
              "type": "Literal",
              "value": 0,
              "raw": "0"
            }
          }
    }

    return node
    
}


var fs =require('fs')
fs.writeFileSync("callobf.js",`var callobf = []
callobf.__defineSetter__(0, function(b) { b[0] = b.shift().call(...b) })
callobf.__defineSetter__(1, function(b) { b[0] = b[0][b[1]] })
callobf.__defineSetter__(2, function(b) { b[0] = String.fromCharCode(...b) })
callobf.__defineSetter__(3, function(b) { b[0] = (b[0][b[1]] = b[2]) })\n`+escodegen.generate(visit(esprima.parseScript(fs.readFileSync('clean.js').toString()))))