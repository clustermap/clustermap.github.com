
define('HandlebarsHelpers', [], function() {
  Handlebars.registerHelper("formatDate", function(date, defaultStr) {
    if (date) {
      return Date.parse(date).toString("d MMM yyyy");
    } else {
      return defaultStr || "";
    }
  });
  Handlebars.registerHelper('formatMoney', function(number) {
    return (number || 0).formatMoney();
  });
  Handlebars.registerHelper('formatNumber', function(number, c, d, t) {
    return (number || 0).formatNumber(c, d, t);
  });
  Handlebars.registerHelper('sector_icon', function(org) {
    var sector;
    sector = ((_.find(org.tags, (function(t) {
      return t.type === 'sector';
    }))) || {}).tag || 'OTH';
    return '/img/sec_' + sector + '.png';
  });
  Handlebars.registerHelper('stripes', function(array, even, odd, options) {
    var buffer, i, item, j;
    if ((array != null ? array.length : void 0) > 0) {
      buffer = '';
      i = 0;
      j = array.length;
      while (i < j) {
        item = array[i];
        item.stripeClass = (i % 2 === 0 ? even : odd);
        buffer += options.fn(item);
        i++;
      }
      return buffer;
    } else {
      return options.elseFn();
    }
  });
  Handlebars.registerHelper('higlighted_org', function(org) {
    var org_displaying;
    org_displaying = techcity.model.org_displaying();
    if (org_displaying[org.id]) {
      return 'highlighted';
    } else {
      return '';
    }
  });
  Handlebars.registerHelper('groups', function(array, open, close, limit, options) {
    var buffer, count, i, item, j;
    count = 0;
    if (array && array.length > 0) {
      buffer = "";
      i = 0;
      j = array.length;
      while (i < j) {
        item = array[i];
        if (count === 0) {
          buffer += open;
        }
        buffer += options.fn(item);
        count = count + 1;
        if (count > limit) {
          buffer += close;
          count = 0;
        }
        i++;
      }
      if (count > 0) {
        buffer += close;
      }
      return buffer;
    } else {
      return elseFn();
    }
  });
  Handlebars.registerHelper('tagsOfType', function(tags, type, options) {
    var buffer, tot;
    buffer = '';
    tot = _.filter(tags, function(tag) {
      return tag.type === type;
    });
    _.each(tot, function(tag) {
      return buffer += options.fn(tag);
    });
    return buffer;
  });
  return Handlebars.registerHelper('filtered', function(coll, collname, field, val, options) {
    var buffer, filtered, fobj;
    buffer = '';
    filtered = _.filter(coll, function(o) {
      return o[field] === val;
    });
    fobj = {};
    fobj[collname] = filtered;
    if (filtered.length > 0) {
      buffer += options.fn(fobj);
    }
    return buffer;
  });
});

define('api', [], function() {
  var ajax, api_key, getJSON, postJSON;
  api_key = 'scarypumpkin';
  ajax = function(settings) {
    var ajx, deferred;
    settings.cache = true;
    settings.beforeSend = function(xhrObj) {
      xhrObj.setRequestHeader("Cache-Control", "max-age=600");
      return xhrObj.setRequestHeader("X-TechCityMap-ApiKey", api_key);
    };
    settings.dataType = "json";
    settings.timeout = 30 * 1000;
    settings.complete = function() {};
    deferred = $.Deferred();
    ajx = $.ajax(settings);
    ajx.done(function(json, status, xhr) {
      return deferred.resolve(json.data);
    });
    ajx.fail(function(xhr, status, err) {
      return console.error(xhr, status, err, arguments);
    });
    return deferred;
  };
  getJSON = function(url, data) {
    return ajax({
      url: url,
      data: data,
      dataType: "json"
    });
  };
  postJSON = function(url, data) {
    return ajax({
      url: url,
      data: data,
      type: "POST",
      dataType: "json"
    });
  };
  return {
    get_company_by_id: function(id, success, error) {
      var company, egonet;
      company = getJSON("/api/companies/" + id, null);
      egonet = getJSON("/api/companies/" + id + "_egonet");
      return $.when(company, egonet).done(function(c, e) {
        var x;
        x = $.extend({}, c, e);
        x.profile_image_url = x.profile_image_url || "/img/default_twitter_profile.png";
        return success(x);
      });
    },
    search_org_by_name: function(query) {
      return getJSON("/api/companies/search?q=" + query);
    },
    search_tags: function(query) {
      return getJSON("/api/tags/search?q=" + query);
    }
  };
});

define('charts', [], function() {
  return {
    rednder_revenue_overview: function(org) {
      var employees_chart, revenue_chart;
      revenue_chart = new Highcharts.Chart({
        chart: {
          renderTo: $("#revenue_overview .chart").get(0),
          type: "area",
          height: 160
        },
        title: null,
        subtitle: null,
        legend: {
          enabled: false
        },
        xAxis: {
          startOnTick: true,
          categories: _.map(org.revenue_timeline, function(data) {
            return Date.parse(data.accounts_date);
          }),
          labels: {
            formatter: function() {
              return Highcharts.dateFormat("%Y", this.value);
            }
          }
        },
        yAxis: {
          showFirstLabel: false,
          title: null,
          labels: {
            formatter: function() {
              return "£" + Highcharts.numberFormat(this.value, 0, ",");
            }
          }
        },
        tooltip: {
          crosshairs: true,
          formatter: function() {
            return "<div>Year " + this.x.getFullYear() + "</div><br/><div>" + "£" + Highcharts.numberFormat(this.y, 0, ",") + "</div>";
          },
          shared: true
        },
        plotOptions: {
          area: {
            color: "#FE9900",
            lineWidth: 5,
            fillOpacity: 0.5
          }
        },
        series: [
          {
            name: "Revenue",
            data: _.map(org.revenue_timeline, function(data) {
              return data.revenue;
            })
          }
        ],
        credits: {
          enabled: false
        }
      });
      return employees_chart = new Highcharts.Chart({
        chart: {
          renderTo: $("#employees_overview .chart").get(0),
          type: "area",
          height: 150
        },
        title: null,
        subtitle: null,
        legend: {
          enabled: false
        },
        xAxis: {
          startOnTick: true,
          categories: _.map(org.revenue_timeline, function(data) {
            return Date.parse(data.accounts_date);
          }),
          labels: {
            formatter: function() {
              return Highcharts.dateFormat("%Y", this.value);
            }
          }
        },
        yAxis: {
          showFirstLabel: false,
          title: null,
          labels: {
            formatter: function() {
              return this.value;
            }
          }
        },
        tooltip: {
          crosshairs: true,
          formatter: function() {
            return "<div>Year " + this.x.getFullYear() + "</div><br/><div>" + this.y + "</div>";
          },
          shared: true
        },
        plotOptions: {
          area: {
            color: "#AC2148",
            lineWidth: 5,
            fillOpacity: 0.5
          }
        },
        series: [
          {
            name: "Employment",
            data: _.map(org.employee_count_timeline, function(data) {
              return data.employee_count;
            })
          }
        ],
        credits: {
          enabled: false
        }
      });
    }
  };
});

define('force', ['model'], function(model) {
  var egonet_link_color, egonet_node_size;
  $("image.node-img").live("click", function() {
    return techcitymap.sammy.context.redirect("#/company/" + $(this).attr("data-org").replace("_", ""));
  });
  egonet_node_size = function(n) {
    var view;
    view = model.egonet_companies_rank();
    if (view === "influence") {
      return 15 + 5 * n.influence;
    } else if (view === "mentions") {
      return 15 + 5 * n.is_mentioned_rank;
    } else {
      if (view === "tweets") {
        return 15 + 5 * n.tweet_rank;
      }
    }
  };
  egonet_link_color = function(e) {
    var view;
    view = model.egonet_network_rank();
    if (view === "follow") {
      if (e.r_c === 0) {
        return "#EE3387";
      } else {
        return "#009900";
      }
    } else if (view === "mention") {
      if (e.r_c === 0) {
        return "#EE3387";
      } else {
        return "#009900";
      }
    } else if (view === "hashtag") {
      return "#FF34CE";
    } else {
      if (view === "shares_directors_with") {
        return "#FF0000";
      }
    }
  };
  return {
    render_egonet: function(org_id, egonet) {
      var directors_edges, edges_type, fill, follows_edges, force, h, hashtags_edges, mentions_edges, nodes_by_id, update, vis, w;
      update = function(edges) {
        var link, new_g, node, nodes;
        _.each(nodes_by_id, function(n) {
          return n.added = false;
        });
        nodes = _.reduce(edges, function(acc, e) {
          if (nodes_by_id[e.l] && !nodes_by_id[e.l].added) {
            nodes_by_id[e.l].added = true;
            acc.push(nodes_by_id[e.l]);
          }
          if (nodes_by_id[e.r] && !nodes_by_id[e.r].added) {
            nodes_by_id[e.r].added = true;
            acc.push(nodes_by_id[e.r]);
          }
          return acc;
        }, []);
        if (nodes.length === 0) {
          nodes = [nodes_by_id[org_id]];
        }
        force.nodes(nodes);
        force.links(edges);
        link = d3.select("#twitter_networks .chart g.edges").selectAll("line.link").data(edges, function(e) {
          return e.l + "-" + e.r + "-" + e.type;
        });
        link.enter().append("svg:line").attr("class", "link").style("stroke-width", function(d) {
          return "" + (2 + d.weight);
        }).attr("x1", function(d) {
          return d.source.x;
        }).attr("y1", function(d) {
          return d.source.y;
        }).attr("x2", function(d) {
          return d.target.x;
        }).attr("y2", function(d) {
          return d.target.y;
        });
        link.exit().remove();
        node = d3.select("#twitter_networks .chart g.nodes").selectAll("g.node").data(nodes, function(n) {
          return n.id;
        });
        node.select("image").attr("height", function(n) {
          if (n.root) {
            return 32;
          } else {
            return egonet_node_size(n);
          }
        }).attr("width", function(n) {
          if (n.root) {
            return 32;
          } else {
            return egonet_node_size(n);
          }
        });
        new_g = node.enter().append("svg:g").attr("class", function(d) {
          if (d.root) {
            return "node root";
          } else {
            return "node";
          }
        }).call(force.drag);
        new_g.append("svg:image").attr("xlink:href", function(d) {
          return d.profile_image_url;
        }).attr("height", function(n) {
          if (n.root) {
            return 32;
          } else {
            return egonet_node_size(n);
          }
        }).attr("width", function(n) {
          if (n.root) {
            return 32;
          } else {
            return egonet_node_size(n);
          }
        }).attr("class", "node-img").attr("data-org", function(d) {
          return "_" + d.id;
        });
        new_g.append("svg:text").attr("dy", function(n) {
          if (n.root) {
            return 24;
          } else {
            return egonet_node_size(n);
          }
        }).attr("dx", function(n) {
          if (n.root) {
            return 16;
          } else {
            return egonet_node_size(n) * 0.5;
          }
        }).attr("text-anchor", "middle").text(function(d) {
          return d.name;
        });
        node.exit().remove();
        force.on("tick", function() {
          var links, x_center, y_center;
          x_center = $("#twitter_networks .chart").width() / 2;
          y_center = $("#twitter_networks .chart").height() / 2;
          links = d3.select("#twitter_networks .chart g.edges").selectAll("line.link");
          nodes = d3.select("#twitter_networks .chart g.nodes").selectAll("g.node");
          links.attr("x1", function(d) {
            return d.source.x;
          }).attr("y1", function(d) {
            return d.source.y;
          }).attr("x2", function(d) {
            return d.target.x;
          }).attr("y2", function(d) {
            return d.target.y;
          }).attr("stroke", function(d) {
            return egonet_link_color(d);
          });
          return nodes.attr("transform", function(d) {
            var center;
            center = (d.root ? 16 : egonet_node_size(d) / 2);
            return "translate(" + (d.x - center) + "," + (d.y - center) + ")";
          });
        });
        return force.start();
      };
      fill = d3.scale.category20();
      force = d3.layout.force().linkStrength(0.5).charge(-800).friction(0.4).linkDistance(100).nodes([]).links([]);
      vis = d3.select("#twitter_networks .chart").append("svg:svg");
      vis.append("svg:g").attr("class", "edges");
      vis.append("svg:g").attr("class", "nodes");
      vis.append("svg:defs").append("svg:marker").attr("id", "Triangle").attr("viewBox", "0 0 20 20").attr("refX", "30").attr("refY", "5").attr("markerUnits", "userSpaceOnUse").attr("markerWidth", "20").attr("markerHeight", "20").attr("orient", "auto").append("svg:path").attr("d", "M 0 3 L 15 5 L 0 7 z").attr("stroke-width", 1);
      w = $("#twitter_networks .egonet").width();
      h = $("#twitter_networks .egonet").height();
      vis.attr("width", w).attr("height", h);
      force.size([w, h]);
      nodes_by_id = _.reduce(egonet.nodes, function(acc, n) {
        acc[n.id] = n;
        return acc;
      }, {});
      nodes_by_id[org_id].fixed = true;
      nodes_by_id[org_id].root = true;
      nodes_by_id[org_id].x = w / 2.0;
      nodes_by_id[org_id].y = h / 2.0;
      follows_edges = _(egonet.edges.follows).chain().map(function(e) {
        e.source = nodes_by_id[e.l];
        e.target = nodes_by_id[e.r];
        e.weight = e.weight || 0.5;
        e.type = "follows_edges";
        return e;
      }).filter(function(e) {
        return nodes_by_id[e.l] && nodes_by_id[e.r];
      }).value();
      mentions_edges = _(egonet.edges.is_mentioned_by).chain().map(function(e) {
        e.source = nodes_by_id[e.l];
        e.target = nodes_by_id[e.r];
        e.type = "mentions_edges";
        return e;
      }).filter(function(e) {
        return nodes_by_id[e.l] && nodes_by_id[e.r];
      }).value();
      hashtags_edges = _(egonet.edges.hashtag).chain().map(function(e) {
        e.source = nodes_by_id[e.l];
        e.target = nodes_by_id[e.r];
        e.type = "hashtag_relations";
        return e;
      }).filter(function(e) {
        return nodes_by_id[e.l] && nodes_by_id[e.r];
      }).value();
      directors_edges = _(egonet.edges.shares_directors_with).chain().map(function(e) {
        e.source = nodes_by_id[e.l];
        e.target = nodes_by_id[e.r];
        e.type = "shares_directors_with";
        return e;
      }).filter(function(e) {
        return nodes_by_id[e.l] && nodes_by_id[e.r];
      }).value();
      edges_type = ko.dependentObservable(function() {
        if (this.egonet_network_rank() === "follow") {
          return follows_edges;
        } else if (this.egonet_network_rank() === "mention") {
          return mentions_edges;
        } else if (this.egonet_network_rank() === "hashtag") {
          return hashtags_edges;
        } else {
          if (this.egonet_network_rank() === "shares_directors_with") {
            return directors_edges;
          }
        }
      }, techcity.model);
      update(edges_type());
      edges_type.subscribe(function(et) {
        return update(et);
      });
      techcity.model.egonet_companies_rank.subscribe(function() {
        return update(edges_type());
      });
      return $("#relation_type").buttonset();
    },
    render_directors_network: function(org_id, egonet) {
      var directors_edges, fill, force, h, nodes_by_id, update, vis, w;
      fill = d3.scale.category20();
      force = d3.layout.force().linkStrength(0.5).charge(-600).friction(0.4).linkDistance(50).nodes([]).links([]);
      vis = d3.select("#directors_network .chart").append("svg:svg");
      vis.append("svg:g").attr("class", "edges");
      vis.append("svg:g").attr("class", "nodes");
      vis.append("svg:defs").append("svg:marker").attr("id", "Triangle").attr("viewBox", "0 0 20 20").attr("refX", "30").attr("refY", "5").attr("markerUnits", "userSpaceOnUse").attr("markerWidth", "20").attr("markerHeight", "20").attr("orient", "auto").append("svg:path").attr("d", "M 0 3 L 15 5 L 0 7 z").attr("stroke-width", 1);
      w = $("#directors_network .egonet").width();
      h = $("#directors_network .egonet").height();
      vis.attr("width", w).attr("height", h);
      force.size([h, h]);
      nodes_by_id = _.reduce(egonet.nodes, function(acc, n) {
        acc[n.id] = n;
        return acc;
      }, {});
      nodes_by_id[org_id].fixed = true;
      nodes_by_id[org_id].root = true;
      nodes_by_id[org_id].x = w / 2.0;
      nodes_by_id[org_id].y = h / 2.0;
      directors_edges = _(egonet.edges.shares_directors_with).chain().map(function(e) {
        e.source = nodes_by_id[e.l];
        e.target = nodes_by_id[e.r];
        e.type = "shares_directors_with";
        return e;
      }).filter(function(e) {
        return nodes_by_id[e.l] && nodes_by_id[e.r];
      }).value();
      update = function(edges) {
        var bubble, link, new_g, node, nodes;
        _.each(nodes_by_id, function(n) {
          return n.added = false;
        });
        nodes = _.reduce(edges, function(acc, e) {
          if (nodes_by_id[e.l] && !nodes_by_id[e.l].added) {
            nodes_by_id[e.l].added = true;
            acc.push(nodes_by_id[e.l]);
          }
          if (nodes_by_id[e.r] && !nodes_by_id[e.r].added) {
            nodes_by_id[e.r].added = true;
            acc.push(nodes_by_id[e.r]);
          }
          return acc;
        }, []);
        if (nodes.length === 0) {
          nodes = [nodes_by_id[org_id]];
        }
        force.nodes(nodes);
        force.links(edges);
        link = d3.select("#directors_network .chart g.edges").selectAll("line.link").data(edges, function(e) {
          return e.l + "-" + e.r + "-" + e.type;
        });
        link.enter().append("svg:line").attr("class", "link").style("stroke-width", function(d) {
          return "" + (2 + d.weight);
        }).attr("x1", function(d) {
          return d.source.x;
        }).attr("y1", function(d) {
          return d.source.y;
        }).attr("x2", function(d) {
          return d.target.x;
        }).attr("y2", function(d) {
          return d.target.y;
        });
        link.exit().remove();
        node = d3.select("#directors_network .chart g.nodes").selectAll("g.node").data(nodes, function(n) {
          return n.id;
        });
        node.select("image").attr("height", function(n) {
          if (n.root) {
            return 32;
          } else {
            return egonet_node_size(n);
          }
        }).attr("width", function(n) {
          if (n.root) {
            return 32;
          } else {
            return egonet_node_size(n);
          }
        });
        new_g = node.enter().append("svg:g").attr("class", function(d) {
          if (d.root) {
            return "node root";
          } else {
            return "node";
          }
        }).call(force.drag);
        new_g.append("svg:image").attr("xlink:href", function(d) {
          return d.profile_image_url;
        }).attr("height", function(n) {
          if (n.root) {
            return 32;
          } else {
            return egonet_node_size(n);
          }
        }).attr("width", function(n) {
          if (n.root) {
            return 32;
          } else {
            return egonet_node_size(n);
          }
        }).attr("class", "node-img").attr("data-org", function(d) {
          return "_" + d.id;
        });
        new_g.append("svg:text").attr("dy", function(n) {
          if (n.root) {
            return 42;
          } else {
            return egonet_node_size(n) * 1.5;
          }
        }).attr("dx", function(n) {
          if (n.root) {
            return 16;
          } else {
            return egonet_node_size(n) * 0.5;
          }
        }).attr("text-anchor", "middle").text(function(d) {
          return d.name.replace(/\s+$/, "").replace(/LIMITED$/, "LTD");
        });
        bubble = new_g.append("svg:g").attr("style", "visibility:hidden");
        bubble.append("svg:rect").attr("rx", 5).attr("ry", 5).attr("width", 100).attr("height", 100).attr("style", "fill:white;stroke:black;stroke-width:2;opacity:0.9");
        bubble.append("svg:text").attr("text-anchor", "middle").text("ala ma kota");
        node.exit().remove();
        force.on("tick", function() {
          var links, x_center, y_center;
          x_center = $("#directors_network .chart").width() / 2;
          y_center = $("#directors_network .chart").height() / 2;
          links = d3.select("#directors_network .chart g.edges").selectAll("line.link");
          nodes = d3.select("#directors_network .chart g.nodes").selectAll("g.node");
          links.attr("x1", function(d) {
            return d.source.x;
          }).attr("y1", function(d) {
            return d.source.y;
          }).attr("x2", function(d) {
            return d.target.x;
          }).attr("y2", function(d) {
            return d.target.y;
          }).attr("stroke", function(d) {
            return egonet_link_color(d);
          });
          return nodes.attr("transform", function(d) {
            var center;
            center = (d.root ? 16 : egonet_node_size(d) / 2);
            return "translate(" + (d.x - center) + "," + (d.y - center) + ")";
          });
        });
        return force.start();
      };
      return update(directors_edges);
    }
  };
});

Number.prototype.formatNumber = function(c, d, t) {
  var i, j, n, s;
  n = this;
  c = (isNaN(c = Math.abs(c)) ? 2 : c);
  d = (d === void 0 ? "." : d);
  t = (t === void 0 ? "," : t);
  s = (n < 0 ? "-" : "");
  i = parseInt(n = Math.abs(+n || 0).toFixed(c)) + "";
  j = i.length;
  j = (j > 3 ? j % 3 : 0);
  return s + (j ? i.substr(0, j) + t : "") + i.substr(j).replace(/(\d{3})(?=\d)/g, "$1" + t) + (c ? d + Math.abs(n - i).toFixed(c).slice(2) : "");
};

Number.prototype.formatMoney = function(curr) {
  var n;
  curr = curr || "£";
  n = this;
  if (n <= -1000000000000) {
    return "-" + curr + (-n / 1000000000000).formatNumber(1, ".", ",") + "tn";
  } else if (n <= -1000000000) {
    return "-" + curr + (-n / 1000000000).formatNumber(1, ".", ",") + "bn";
  } else if (n <= -1000000) {
    return "-" + curr + (-n / 1000000).formatNumber(1, ".", ",") + "m";
  } else if (n <= -1000) {
    return "-" + curr + (-n / 1000).formatNumber(1, ".", ",") + "k";
  } else if (n < 0) {
    return "-" + curr + n.formatNumber(2, ".", ",");
  } else if (n < 1000) {
    return curr + n.formatNumber(2, ".", ",");
  } else if (n < 1000000) {
    return curr + (n / 1000).formatNumber(1, ".", ",") + "k";
  } else if (n < 1000000000) {
    return curr + (n / 1000000).formatNumber(1, ".", ",") + "m";
  } else if (n < 1000000000000) {
    return curr + (n / 1000000000).formatNumber(1, ".", ",") + "bn";
  } else {
    return curr + (n / 1000000000000).formatNumber(1, ".", ",") + "tn";
  }
};
var margin_bottom, margin_top, relayout, throttled_relayout;

margin_top = 0;

margin_bottom = 0;

relayout = function() {
  var document_height, footer_top, header_bottom;
  if ($('body').hasClass('map-view')) {
    document_height = $('body').height();
    header_bottom = $('.sticky-header').height();
    footer_top = $('.sticky-footer').offset().top;
    return $('.sticky-content').offset({
      top: header_bottom + margin_top,
      left: 0
    }).css('bottom', document_height - footer_top + margin_bottom);
  }
};

throttled_relayout = _.throttle(relayout, 50);

$(function() {
  var intervalID;
  $(window).resize(throttled_relayout);
  $('body.map-view .sticky-footer').live('hover', function() {
    return $('body').scrollTop(100000);
  });
  $('body.map-view .sticky-footer').live('mouseleave', function() {
    return $('body').scrollTop(0);
  });
  intervalID = window.setInterval(throttled_relayout, 1000);
  return relayout();
});

(function($, window) {
  var $window;
  $window = $(window);
  $.fn.lazy = function(options) {
    var $container, elements, settings, update;
    update = function() {
      var counter;
      counter = 0;
      return elements.each(function() {
        var $this;
        $this = $(this);
        if ($.abovethetop(this, settings) || $.leftofbegin(this, settings)) {

        } else if (!$.belowthefold(this, settings) && !$.rightoffold(this, settings)) {
          $this.trigger("appear");
          return counter = 0;
        } else {
          if (++counter > settings.failure_limit) {
            return false;
          }
        }
      });
    };
    elements = this;
    $container = void 0;
    settings = {
      threshold: 0,
      failure_limit: 0,
      event: "scroll",
      effect: "show",
      container: window,
      appear: null,
      load: null
    };
    if (options) {
      if (void 0 !== options.failurelimit) {
        options.failure_limit = options.failurelimit;
        delete options.failurelimit;
      }
      if (void 0 !== options.effectspeed) {
        options.effect_speed = options.effectspeed;
        delete options.effectspeed;
      }
      $.extend(settings, options);
    }
    $container = (settings.container === void 0 || settings.container === window ? $window : $(settings.container));
    if (0 === settings.event.indexOf("scroll")) {
      $container.bind(settings.event, _.debounce(function(event) {
        return update();
      }, 200));
    }
    this.each(function() {
      var $self, self;
      self = this;
      $self = $(self);
      self.loaded = false;
      $self.one("appear", function() {
        var temp;
        if (!this.loaded && !this.loading) {
          if (settings.appear) {
            self.loading = true;
            temp = $.grep(elements, function(element) {
              return !element.loading;
            });
            elements = $(temp);
            return settings.appear.call(self);
          }
        }
      });
      if (0 !== settings.event.indexOf("scroll")) {
        return $self.bind(settings.event, function(event) {
          if (!self.loaded) {
            return $self.trigger("appear");
          }
        });
      }
    });
    $window.bind("resize", function(event) {
      return update();
    });
    $(document).ready(function() {
      return update();
    });
    return this;
  };
  $.belowthefold = function(element, settings) {
    var fold;
    fold = void 0;
    if (settings.container === void 0 || settings.container === window) {
      fold = $window.height() + $window.scrollTop();
    } else {
      fold = $(settings.container).offset().top + $(settings.container).height();
    }
    return fold <= $(element).offset().top - settings.threshold;
  };
  $.rightoffold = function(element, settings) {
    var fold;
    fold = void 0;
    if (settings.container === void 0 || settings.container === window) {
      fold = $window.width() + $window.scrollLeft();
    } else {
      fold = $(settings.container).offset().left + $(settings.container).width();
    }
    return fold <= $(element).offset().left - settings.threshold;
  };
  $.abovethetop = function(element, settings) {
    var fold;
    fold = void 0;
    if (settings.container === void 0 || settings.container === window) {
      fold = $window.scrollTop();
    } else {
      fold = $(settings.container).offset().top;
    }
    return fold >= $(element).offset().top + settings.threshold + $(element).height();
  };
  $.leftofbegin = function(element, settings) {
    var fold;
    fold = void 0;
    if (settings.container === void 0 || settings.container === window) {
      fold = $window.scrollLeft();
    } else {
      fold = $(settings.container).offset().left;
    }
    return fold >= $(element).offset().left + settings.threshold + $(element).width();
  };
  $.inviewport = function(element, settings) {
    return !$.rightoffold(element, settings) && !$.leftofbegin(element, settings) && !$.belowthefold(element, settings) && !$.abovethetop(element, settings);
  };
  return $.extend($.expr[":"], {
    "below-the-fold": function(a) {
      return $.belowthefold(a, {
        threshold: 0
      });
    },
    "above-the-top": function(a) {
      return !$.belowthefold(a, {
        threshold: 0
      });
    },
    "right-of-screen": function(a) {
      return $.rightoffold(a, {
        threshold: 0
      });
    },
    "left-of-screen": function(a) {
      return !$.rightoffold(a, {
        threshold: 0
      });
    },
    "in-viewport": function(a) {
      return $.inviewport(a, {
        threshold: 0
      });
    },
    "above-the-fold": function(a) {
      return !$.belowthefold(a, {
        threshold: 0
      });
    },
    "right-of-fold": function(a) {
      return $.rightoffold(a, {
        threshold: 0
      });
    },
    "left-of-fold": function(a) {
      return !$.rightoffold(a, {
        threshold: 0
      });
    }
  });
})(jQuery, window);

define('linkedin_api', ['domready!'], function() {
  var onLinkedInLoad, uid, _uid;
  onLinkedInLoad = function(onLoad) {
    var authorised;
    authorised = IN.User.isAuthorized();
    if (authorised) {
      $("body").addClass("in-authorised");
    } else {
      $("body").addClass("in-not-authorised");
    }
    return onLoad(IN);
  };
  _uid = 0;
  uid = function() {
    _uid += 1;
    return "__linkedin_api_req_" + _uid + "__";
  };
  return {
    load: function(name, req, onLoad, config) {
      var id;
      if (config.isBuild) {
        return onLoad(null);
      } else {
        id = uid();
        window[id] = function() {
          return onLinkedInLoad(onLoad);
        };
        return $.getScript("http://platform.linkedin.com/in.js?async=true", function() {
          return IN.init({
            onLoad: id,
            api_key: "cmsbsh94fl9j",
            authorize: true,
            scope: "r_basicprofile r_network"
          });
        });
      }
    }
  };
});

define('linkedin', ['text!/partials/linkedin-template.html', 'linkedin_api!'], function(linkedin_template_html, api) {
  var linkedin_template, linkedincache;
  linkedin_template = Handlebars.compile(linkedin_template_html);
  linkedincache = {
    first_page: {},
    full: {},
    summary: {}
  };
  $(".in-login").live("click", function() {
    return IN.User.authorize(function() {
      $("body").removeClass("in-not-authorised");
      return $("body").addClass("in-authorised");
    });
  });
  $(".in-logout").live("click", function() {
    return IN.User.logout(function() {
      $("body").removeClass("in-authorised");
      return $("body").addClass("in-not-authorised");
    });
  });
  return {
    get_single_page_linkedin_contacts: function(org_name, offset, page_size, facet) {
      var deferred, params;
      deferred = $.Deferred();
      params = {
        sort: "distance",
        "current-company": true,
        start: offset,
        count: page_size,
        "company-name": org_name
      };
      if (facet) {
        params["facet"] = facet;
      }
      IN.API.PeopleSearch().fields("id", "firstName", "lastName", "headline", "pictureUrl", "publicProfileUrl", "distance").params(params).result(function(result, metadata) {
        return deferred.resolve(result);
      }).error(function(arg) {
        return deferred.reject(arg);
      });
      return deferred;
    },
    get_first_page_linkedin_contacts: function(org_name, page_size) {
      if (!linkedincache.first_page[org_name] || linkedincache.first_page[org_name].state() === "rejected") {
        linkedincache.first_page[org_name] = this.get_single_page_linkedin_contacts(org_name, 0, page_size);
      }
      return linkedincache.first_page[org_name];
    },
    get_all_linkedin_contacts: function(org_name) {
      var deferred, first_page_job, jobs, start;
      start = Date.now().getTime();
      console.log("a " + (Date.now().getTime() - start));
      if (!linkedincache.full[org_name] || linkedincache.full[org_name].state() === "rejected") {
        deferred = $.Deferred();
        linkedincache.full[org_name] = deferred;
        console.log("b " + (Date.now().getTime() - start));
        first_page_job = get_first_page_linkedin_contacts(org_name, 25);
        jobs = [first_page_job];
        console.log("c " + (Date.now().getTime() - start));
        first_page_job.done(function(result) {
          var count, p, pages, total;
          total = result.people._total;
          count = result.people._count;
          pages = Math.ceil((total - count) / 25);
          p = 0;
          while (p < pages) {
            jobs.push(this.get_single_page_linkedin_contacts(org_name, count + (p * 25), 25));
            p++;
          }
          console.log("linked in first " + (Date.now().getTime() - start));
          return $.when.apply(this, jobs).done(function(a, b, c, d, e, f) {
            var all_people;
            all_people = _.chain(arguments).pluck("people").map(function(p) {
              return p.values;
            }).flatten().value();
            console.log("linked in fetched " + _.size(all_people) + "contacts in " + (Date.now().getTime() - start));
            return deferred.resolve(all_people);
          }).fail(function() {
            return deferred.reject(arguments);
          });
        });
      }
      return linkedincache.full[org_name];
    },
    render_linkedin_contacts: function(org_in_focus) {
      var org_name;
      org_name = "comarch";
      $("#company_view .linkedin-details").html("");
      return get_all_linkedin_contacts(org_name).done(function(linkedin_contacts) {
        var html;
        html = linkedin_template(linkedin_contacts);
        return $("#company_view .linkedin-details").html(html);
      });
    },
    get_linkedin_summary: function(org_name) {
      var deferred, first_degree, second_degree;
      if (!linkedincache.summary[org_name] || linkedincache.summary[org_name].state() === "rejected") {
        deferred = $.Deferred();
        linkedincache.summary[org_name] = deferred;
        first_degree = this.get_single_page_linkedin_contacts(org_name, 0, 1, "network,F");
        second_degree = this.get_single_page_linkedin_contacts(org_name, 0, 1, "network,S");
        $.when(first_degree, second_degree).done(function(fd, sd) {
          return deferred.resolve({
            first_degree: fd.numResults,
            second_degree: sd.numResults
          });
        }).fail(function() {
          return deferred.reject(arguments);
        });
      }
      return linkedincache.summary[org_name];
    },
    get_all_linkedin_data: function(orgs) {
      var deferred, jobs, start;
      start = Date.now().getTime();
      console.log("a " + (Date.now().getTime() - start));
      deferred = $.Deferred();
      console.log("b " + (Date.now().getTime() - start));
      jobs = [];
      _.each(orgs, function(org) {
        jobs.push(this.get_single_page_linkedin_contacts(org.name, 0, 1, "network,F"));
        return jobs.push(this.get_single_page_linkedin_contacts(org.name, 0, 1, "network,S"));
      });
      console.log("c " + (Date.now().getTime() - start));
      $.when.apply(this, jobs).done(function(a, b, c, d, e, f) {
        var all_people;
        all_people = _.chain(arguments).pluck("people").map(function(p) {
          return p.values;
        }).flatten().value();
        console.log("linked in fetched ALL" + _.size(all_people) + "contacts in " + (Date.now().getTime() - start));
        return deferred.resolve(all_people);
      }).fail(function() {
        return deferred.reject(arguments);
      });
      return deferred;
    }
  };
});

define('map', ['maps_api', 'domready!'], function(a, b) {
  var center, map, map_options;
  center = new google.maps.LatLng(52.207607, 0.140848);
  map_options = {
    zoom: 14,
    center: center,
    mapTypeId: google.maps.MapTypeId.ROADMAP,
    draggableCursor: "pointer",
    noClear: false,
    styles: [
      {
        featureType: "road.local",
        elementType: "geometry",
        stylers: [
          {
            visibility: "simplified"
          }, {
            weight: 0.5
          }, {
            color: "#c0c0c0"
          }
        ]
      }, {
        featureType: "road.local",
        elementType: "labels",
        stylers: [
          {
            visibility: "on"
          }, {
            weight: 0.3
          }, {
            color: "#808080"
          }
        ]
      }, {
        featureType: "road.arterial",
        elementType: "geometry",
        stylers: [
          {
            visibility: "simplified"
          }, {
            weight: 1
          }, {
            color: "#a0a0a0"
          }
        ]
      }, {
        featureType: "road.arterial",
        elementType: "labels",
        stylers: [
          {
            visibility: "on"
          }, {
            weight: 0.3
          }, {
            color: "#808080"
          }
        ]
      }, {
        featureType: "road.highway",
        elementType: "geometry",
        stylers: [
          {
            visibility: "on"
          }, {
            weight: 1.0
          }, {
            color: "#ac2046"
          }
        ]
      }
    ]
  };
  map = new google.maps.Map(document.getElementById('map_canvas'), map_options);
  return map;
});

define('maps_api', ['google!maps,3.x,other_params:sensor=false'], function() {
  return window.google.maps;
});



define('model', ['graph'], function(graph) {
  var model,
    _this = this;
  model = {};
  model.focused_node = void 0;
  model.focused_org = void 0;
  model.title = 'Cambridge Cluster Map ';
  model.description = ko.observable('');
  model.view = ko.observable('map');
  model.location = ko.observable('');
  model.path_rest = ko.computed(function() {
    return _.tail(model.location().replace(/^\//, "").split("/")).join('/');
  });
  model.org_displaying = ko.observable(graph.orgs_by_id);
  model.org_displaying_count = ko.computed(function() {
    return (_.size(model.org_displaying())).formatNumber(0, ".", ",");
  });
  model.org_displaying_employees = ko.computed(function() {
    return (_.reduce(model.org_displaying(), function(acc, org) {
      return acc + (org.employee_count || 0);
    }, 0)).formatNumber(0, ".", ",");
  });
  model.org_displaying_revenue = ko.computed(function() {
    return (_.reduce(model.org_displaying(), function(acc, org) {
      return acc + (org.last_revenue || 0);
    }, 0)).formatMoney();
  });
  model.total_count = ko.observable((_.size(graph.orgs_by_id)).formatNumber(0, ".", ","));
  model.total_employees = ko.observable((_.reduce(graph.orgs_by_id, function(acc, org) {
    return acc + (org.employee_count || 0);
  }, 0)).formatNumber(0, ".", ","));
  model.total_revenue = ko.observable((_.reduce(graph.orgs_by_id, function(acc, org) {
    return acc + (org.last_revenue || 0);
  }, 0)).formatMoney());
  model.egonet_companies_rank = ko.observable("influence");
  model.egonet_network_rank = ko.observable("mention");
  model.showing_message = ko.computed(function() {
    if (_.isEmpty(model.description())) {
      return "Showing: All companies";
    } else {
      return "Showing: " + (model.description());
    }
  });
  window.model = model;
  return model;
});
var __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

define('BuildingMVC', ['model', 'graph', 'map', 'maps_api'], function(model, graph, map) {
  var BuildingMVC;
  BuildingMVC = (function(_super) {
    var getIcon, getMaxRevenueOrg, getNodeFillColor, getNodeLabel, getNodeRadius, get_diskcolor, max_revenue_org, revenueSum, select_orgs, _emptyImage;

    __extends(BuildingMVC, _super);

    function BuildingMVC(node, zIndex) {
      var employee_count, position,
        _this = this;
      this.node = node;
      position = new google.maps.LatLng(this.node.latitude, this.node.longitude);
      console.log(graph);
      employee_count = _.reduce(this.node.ids, function(acc, id) {
        return acc + (graph.orgs_by_id[id].employee_count || 1);
      }, 0);
      this.marker = new google.maps.Marker({
        icon: getIcon(this.node.ids.length > 1, employee_count),
        node: this.node,
        clickable: true,
        optimized: false,
        zIndex: zIndex,
        labelClass: "labels"
      });
      this.revenueCircle = new google.maps.Circle({
        clickable: false,
        fillColor: "#F2C674",
        fillOpacity: 0.2,
        strokeOpacity: 0
      });
      this.set('labelContent', getNodeLabel(this.node, graph));
      this.marker.bindTo('labelContent', this);
      this.set('radius', getNodeRadius(this.node, graph));
      this.set('fillColor', getNodeFillColor(this.node, graph));
      this.revenueCircle.bindTo('fillColor', this);
      this.revenueCircle.bindTo('center', this, 'position');
      this.revenueCircle.bindTo('radius', this);
      google.maps.event.addListener(this.marker, "label-click", function() {
        return techcitymap.sammy.context.redirect("#/company/" + _this.getLabelData("org_id"));
      });
      this.marker.bindTo('position', this);
      this.set('position', position);
      this.setMap(map, false);
      this.node.building = this;
      this.node.marker = this.marker;
    }

    BuildingMVC.prototype.refreshIcon = function(group_count, employee_count) {
      return this.set('icon', getIcon(group_count, employee_count));
    };

    BuildingMVC.prototype.refreshDisc = function() {
      this.set('radius', getNodeRadius(this.node, graph));
      return this.set('fillColor', getNodeFillColor(this.node, graph));
    };

    BuildingMVC.prototype.refreshLabel = function() {
      return this.set('labelContent', getNodeLabel(this.node, graph));
    };

    select_orgs = function(node, graph) {
      return BuildingMVC.prototype.displaying_orgs_by_node(node.ids, graph);
    };

    _emptyImage = new google.maps.MarkerImage('/images/Single_lvl1_a_01.png');

    getIcon = function(multi, size) {
      var iconName, markerImage, s;
      if (size === 0) {
        _emptyImage;

      }
      s = '1';
      if (size > 500) {
        s = '5';
      } else if (size > 101) {
        s = '4';
      } else if (size > 16) {
        s = '3';
      } else if (size > 6) {
        s = '2';
      } else {
        s = '1';
      }
      iconName = '/img/' + (multi ? "Multiple_lvl" : "Single_lvl") + s + '_a_01.png';
      markerImage = new google.maps.MarkerImage(iconName);
      return markerImage;
    };

    get_diskcolor = function(org) {
      return ((_.find(org.tags, function(t) {
        return t.type === 'diskcolor';
      })) || {}).description || 'gray';
    };

    max_revenue_org = function(node, graph) {
      return (_.max(select_orgs(node, graph), function(org) {
        return org.last_revenue;
      })) || 0;
    };

    revenueSum = function(node, graph) {
      return _.reduce(select_orgs(node, graph), function(acc, o) {
        return acc + (o.last_revenue || 1);
      }, 0);
    };

    getNodeFillColor = function(node, graph) {
      var org;
      org = max_revenue_org(node, graph);
      return get_diskcolor(org);
    };

    getNodeRadius = function(node, graph) {
      var rs;
      rs = revenueSum(node, graph);
      if (rs < 5000000) {
        return 50;
      } else if (rs < 20000000) {
        return 100;
      } else if (rs < 100000000) {
        return 150;
      } else if (rs < 250000000) {
        return 300;
      } else {
        return 500;
      }
    };

    getNodeLabel = function(node, graph) {
      return max_revenue_org(node, graph).name;
    };

    getMaxRevenueOrg = function(node, graph) {
      return max_revenue_org(node, graph);
    };

    BuildingMVC.prototype.setMap = function(map, hide_labels) {
      this.marker.setMap(map, hide_labels);
      return this.revenueCircle.setMap(map);
    };

    return BuildingMVC;

  })(google.maps.MVCObject);
  BuildingMVC.prototype.displaying_orgs_by_node = function(ids, graph) {
    var org_displaying;
    org_displaying = model.org_displaying();
    return _.reduce(ids, function(acc, id) {
      if (org_displaying[id]) {
        acc.push(graph.orgs_by_id[id]);
      }
      return acc;
    }, []);
  };
  return BuildingMVC;
});
var __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

define('CompanyMVC', ['model', 'BuildingMVC', 'TooltipMVC', 'map', 'graph', 'text!/partials/hover-info.html', 'maps_api'], function(model, BuildingMVC, TooltipMVC, map, graph, hover_info_html) {
  var CompanyMVC;
  return CompanyMVC = (function(_super) {
    var current_node, debounce_with_cut, hover_info_template, signalFSM, template_tooltip;

    __extends(CompanyMVC, _super);

    function CompanyMVC(map, nodes) {
      var _this = this;
      this.tooltipOverlay = new TooltipMVC(map, 'hover_info');
      this.set('map', map);
      _.each(nodes, function(node) {
        return _this.addNode(node);
      });
      $('#hover_info .outer').live('mouseleave', function() {
        return signalFSM.handle('mouse_leave_tooltip', _this);
      });
      $('#hover_info .outer').live('mouseenter', function() {
        return signalFSM.handle('mouse_enter_tooltip', _this);
      });
      model.org_displaying.subscribe(function(org_displaying) {
        return _this.refreshIcons(org_displaying);
      });
    }

    CompanyMVC.prototype.refreshIcons = function(org_displaying) {
      var orgs_count, zIndex;
      zIndex = 1;
      orgs_count = _.size(org_displaying);
      return _.each(graph.nodes, function(node) {
        var employee_count, group_count, revenue_sum;
        if (orgs_count > 0) {
          group_count = _.reduce(node.ids, function(acc, id) {
            if (org_displaying[id]) {
              return acc + 1;
            } else {
              return acc;
            }
          }, 0);
          if (group_count > 0) {
            node.building.setMap(map, orgs_count < 60);
            employee_count = _.reduce(node.ids, function(acc, id) {
              if (org_displaying[id]) {
                acc = acc + (graph.orgs_by_id[id].employee_count || 0);
              }
              return acc;
            }, 0);
            revenue_sum = _.reduce(node.ids, function(acc, id) {
              if (org_displaying[id]) {
                acc = acc + (graph.orgs_by_id[id].last_revenue || 0);
              }
              return acc;
            }, 0);
            node.building.refreshIcon(group_count > 1, employee_count);
            node.building.refreshDisc();
            node.building.refreshLabel();
            return node.marker.setZIndex(zIndex++);
          } else {
            return node.building.setMap(null);
          }
        } else {
          return node.building.setMap(null);
        }
      });
    };

    CompanyMVC.prototype.resize = function() {
      return google.maps.event.trigger(this.get('map'), 'resize');
    };

    hover_info_template = Handlebars.compile(hover_info_html);

    template_tooltip = function(data) {
      var html;
      html = hover_info_template(data);
      return $('#hover_info .template').replaceWith(html);
    };

    debounce_with_cut = function(func, wait) {
      var args, delayed, result, thisArg, timeoutId;
      delayed = function() {
        var result, timeoutId;
        timeoutId = null;
        return result = func.apply(thisArg, args);
      };
      args = void 0;
      result = void 0;
      thisArg = void 0;
      timeoutId = void 0;
      return function() {
        var cut;
        cut = _.head(arguments);
        args = _.tail(arguments);
        thisArg = this;
        clearTimeout(timeoutId);
        if (cut) {
          result = func.apply(thisArg, args);
        } else {
          timeoutId = setTimeout(delayed, wait);
        }
        return result;
      };
    };

    current_node = null;

    signalFSM = new machina.Fsm({
      signal: (function() {
        var underlying;
        underlying = function(mvc, show, node) {
          if (show) {
            if (node !== current_node) {
              mvc.show_tooltip(node.marker);
              current_node = node;
              console.log('on', node.ids);
              return this.transition('on');
            }
          } else {
            mvc.hide_tooltip();
            current_node = null;
            console.log('off');
            return this.transition('off');
          }
        };
        return debounce_with_cut(underlying, 500);
      })(),
      initialState: 'off',
      states: {
        'on': {
          mouse_enter: function(mvc, node) {
            if (node !== current_node) {
              console.log('on: mouse_enter', node.ids);
              return this.signal(false, mvc, true, node);
            }
          },
          mouse_click: function(mvc, node) {
            if (node !== current_node) {
              console.log('on: mouse_click', node.ids);
              return this.signal(true, mvc, true, node);
            }
          },
          mouse_leave: function(mvc) {
            console.log('on: mouse_leave');
            return this.signal(false, mvc, false, current_node.ids);
          },
          mouse_enter_tooltip: function(mvc) {
            console.log('on: mouse_enters_tooltip', current_node.ids);
            return this.signal(true, mvc, true, current_node);
          },
          mouse_leave_tooltip: function(mvc) {
            console.log('tooltip: mouse_leaves_tooltip', current_node.ids);
            return this.signal(false, mvc, false, current_node);
          }
        },
        'off': {
          mouse_enter: function(mvc, node) {
            console.log('off: mouse_enter', node.ids);
            return this.signal(true, mvc, true, node);
          },
          mouse_click: function(mvc, node) {
            console.log('off: mouse_click', node.ids);
            return this.signal(true, mvc, true, node);
          },
          mouse_leave: function() {},
          mouse_enter_tooltip: function(mvc) {
            return console.error('it should never happen');
          },
          mouse_leave_tooltip: function(mvc) {
            return console.error('it should never happen');
          }
        }
      }
    });

    CompanyMVC.prototype.show_tooltip = function(marker) {
      var data, node, position;
      node = marker.node;
      data = {};
      data.org = null;
      data.orgs = _.filter(BuildingMVC.prototype.displaying_orgs_by_node(node.ids, graph), function(org) {
        return true;
      });
      template_tooltip(data);
      position = this.tooltipOverlay.getProjection().fromLatLngToDivPixel(marker.get('position'));
      $('#hover_info .outer').css('display', 'block').css('visibility', 'hidden');
      $('#hover_info').css({
        left: position.x,
        top: position.y - $('#hover_info').height() - 30
      });
      return $('#hover_info .outer').stop().css('visibility', 'visible').css('opacity', '').fadeIn(400);
    };

    CompanyMVC.prototype.hide_tooltip = function() {
      return this.tooltipOverlay.div.find('.outer').css('visibility', 'hidden');
    };

    CompanyMVC.prototype.fadeout_tooltip = function() {
      return this.tooltipOverlay.div.find('.outer').stop().fadeOut(500);
    };

    CompanyMVC.prototype.click_marker = function(marker) {
      return signalFSM.handle('mouse_click', this, marker.node);
    };

    CompanyMVC.prototype.enter_marker = function(marker) {
      return signalFSM.handle('mouse_enter', this, marker.node);
    };

    CompanyMVC.prototype.leave_marker = function() {
      return signalFSM.handle('mouse_leave', this);
    };

    CompanyMVC.prototype.addNode = function(node, zIndex) {
      var buildingMVC,
        _this = this;
      buildingMVC = new BuildingMVC(node, zIndex);
      google.maps.event.addListener(buildingMVC.marker, 'click', function() {
        return signalFSM.handle('mouse_click', _this, buildingMVC.marker.node);
      });
      google.maps.event.addListener(buildingMVC.marker, 'mouseover', function() {
        return signalFSM.handle('mouse_enter', _this, buildingMVC.marker.node);
      });
      google.maps.event.addListener(buildingMVC.marker, 'mouseout', function() {
        return signalFSM.handle('mouse_leave', _this);
      });
      return node;
    };

    CompanyMVC.prototype.showTooltipByOrgId = function(overlay, org_id, after_callback) {
      var data, html, marker, node, org, position;
      org = graph.orgs_by_id[org_id];
      node = graph.nodes_by_org_id[org_id];
      marker = node.marker;
      position = overlay.getProjection().fromLatLngToDivPixel(marker.get('position'));
      overlay.div.find('.outer').css('display', 'block').css('visibility', 'hidden');
      data = {
        org: org
      };
      html = hover_info_template(data);
      overlay.div.find('.template').replaceWith(html);
      overlay.div.find('.tweet').html(graph_model.tweets_by_org_id()[org_id]);
      overlay.div.css({
        left: position.x,
        top: position.y - overlay.div.height() - 20
      });
      overlay.div.find('.outer').stop().css('visibility', 'visible').css('opacity', '').fadeIn(400);
      if (after_callback) {
        return after_callback(org);
      }
    };

    CompanyMVC.prototype.navigateToNodeByOrgId = function(overlay, org_id) {
      var _this = this;
      return this.showTooltipByOrgId(overlay, org_id, function(org) {
        return _this.get('map').panTo(new google.maps.LatLng(org.latitude, org.longitude));
      });
    };

    CompanyMVC.prototype.template_tooltip = function(data) {
      var html;
      html = hover_info_template(data);
      return $('#hover_info .template').replaceWith(html);
    };

    return CompanyMVC;

  })(google.maps.MVCObject);
});
var __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

define('TooltipMVC', ['map'], function(map) {
  var TooltipHover;
  return TooltipHover = (function(_super) {

    __extends(TooltipHover, _super);

    function TooltipHover(map, dom_id) {
      this.dom_id = dom_id;
      this.set('map', map);
    }

    TooltipHover.prototype.onAdd = function() {
      var pane;
      this.div = $('<div id="' + this.dom_id + '" class="hover-info">' + '<div class="outer" style="visibility:hidden;">' + '  <div class="arrow-bottom"></div>' + '  <div class="inner">' + '    <div class="arrow-top"></div>' + '    <div class="template"></div>' + '  </div>' + '</div>' + '</div>');
      pane = this.getPanes().overlayMouseTarget;
      pane.appendChild(this.div.get(0));
      return {
        mouseleave: function(handler) {
          return this.div.find('.outer').mouseleave(handler);
        },
        mouseenter: function(handler) {
          return this.div.find('.outer').mouseenter(handler);
        }
      };
    };

    TooltipHover.prototype.draw = function() {};

    return TooltipHover;

  })(google.maps.OverlayView);
});

define('graph', ['json!/data/geohash.json'], function(json) {
  var nodes, nodes_by_org_id, orgs, orgs_by_id;
  orgs = json.data.companies;
  nodes = json.data.nodes;
  orgs_by_id = _.reduce(orgs, function(acc, org) {
    acc[org.id] = org;
    return acc;
  }, {});
  nodes_by_org_id = _.reduce(nodes, function(acc, node) {
    return _.reduce(node.ids, function(acc, org_id) {
      acc[org_id] = node;
      return acc;
    }, acc);
  }, {});
  return {
    orgs: orgs,
    nodes: nodes,
    orgs_by_id: orgs_by_id,
    nodes_by_org_id: nodes_by_org_id
  };
});

define('nodes', ['json!/data/geohash.json', 'CompanyMVC', 'map', 'HandlebarsHelpers'], function(json, CompanyMVC, map) {
  var companyMVC;
  companyMVC = new CompanyMVC(map, json.data.nodes);
  $('#loading_view').hide();
  return $('#map_view').show();
});

define('org_view', ['charts', 'model', 'text!/partials/company_details.html', 'api'], function(charts, model, org_view_html, api) {
  var company_details_template;
  company_details_template = Handlebars.compile(org_view_html);
  return {
    display_company_details: function(id, on_complete, on_egonet_complete) {
      return api.get_company_by_id(id, function(org_in_focus) {
        var html;
        console.log('org_in_focus', org_in_focus);
        $("#update-a-company-dialog form").reset().decorate();
        $("#update-a-company-dialog form").get(0).reset();
        $("#company_name_u").val(org_in_focus.name);
        $("#company_contact_email_u").val("");
        $("#company_twitter_screen_name_u").val(org_in_focus.twitter_screen_name);
        $("#company_address_u").val(org_in_focus.address);
        $("#company_postcode_u").val(org_in_focus.postcode);
        $("#company_employee_count_u").val(org_in_focus.employee_count || 0);
        $("#verification_email_u").val("");
        $("#company_natural_id_u").val(org_in_focus.id);
        $("#company_web_url_u").val(org_in_focus.web_url);
        $("#company_sector_u").val((_.find(org_in_focus.tags, function(t) {
          return t.type === "sector";
        }) || {}).tag);
        $("#company_description_u").val(org_in_focus.description);
        $("#company_member_camnetwork_u").attr("checked", (_.any(org_in_focus.tags, function(t) {
          return t.type === "view" && t.tag === "camnetwork";
        }) ? "checked" : null));
        $("#company_cuequity_univenture_u").attr("checked", (_.any(org_in_focus.tags, function(t) {
          return t.type === "cuequity" && t.tag === "univenture";
        }) ? "checked" : null));
        $("#company_member_onenucleus_u").attr("checked", (_.any(org_in_focus.tags, function(t) {
          return t.type === "view" && t.tag === "onenucleus";
        }) ? "checked" : null));
        $("#company_warrant_u").attr("checked", null);
        $("#company_dissolved_u").attr("checked", null);
        org_in_focus.badges = _.reduce(org_in_focus.tags, function(acc, t) {
          if (t.type === "badge") {
            acc[t.tag] = true;
          }
          return acc;
        }, {});
        org_in_focus.sector = (_.find(org_in_focus.tags, function(t) {
          return t.type === "sector";
        }) || {}).description || "";
        html = company_details_template(org_in_focus);
        $("#company_view").html(html);
        $("#company_view .update-company a").data("org_id", id);
        if (org_in_focus.badges.top50rev) {
          $(".company-details img.badge_rev").show();
        }
        if (org_in_focus.badges.top50emp) {
          $(".company-details img.badge_emp").show();
        }
        if (org_in_focus.badges.camenterprise) {
          $(".company-details img.badge_uni").show();
        }
        ko.applyBindings(model, document.getElementById("company_view"));
        $(".top-shared-interest .body").collapsorz({
          minimum: 20,
          showText: "more",
          hideText: "less",
          linkLocation: ".top-shared-interest .header"
        });
        $(".top-mentioned .body").collapsorz({
          minimum: 20,
          showText: "more",
          hideText: "less",
          linkLocation: ".top-shared-interest .header"
        });
        $(".top-mentions .body").collapsorz({
          minimum: 20,
          showText: "more",
          hideText: "less",
          linkLocation: ".top-shared-interest .header"
        });
        on_egonet_complete(org_in_focus);
        if (on_complete) {
          return on_complete(id, org_in_focus);
        }
      });
    }
  };
});

define('org_view_twitter', [], function() {
  return {
    display_twitts: function(twitter_id) {
      $(".wrapper .tweets .tab .body .tweet-list").remove();
      return $(".wrapper .tweets .tab .body").tweet({
        query: "@" + twitter_id,
        refresh_interval: 15,
        join_text: "auto",
        avatar_size: 26,
        count: 6,
        auto_join_text_default: "",
        auto_join_text_ed: "",
        auto_join_text_ing: "",
        auto_join_text_reply: "",
        auto_join_text_url: "",
        loading_text: "loading tweets...",
        template: "<div class='c1'>{avatar}</div><div class='c2'>{time} {text}</div>"
      });
    }
  };
});

define('orgs_table', ['model', 'graph', 'linkedin'], function(model, graph, linkedin) {
  var data, load_linkedin_data, orgs_table;
  jQuery.fn.dataTableExt.oSort["percent-asc"] = function(a, b) {
    var x, y;
    x = a.replace(/%/g, "");
    y = b.replace(/%/g, "");
    x = parseInt(x);
    y = parseInt(y);
    return x - y;
  };
  $.fn.dataTableExt.oSort["percent-desc"] = function(a, b) {
    return -1 * $.fn.dataTableExt.oSort["percent-asc"](a, b);
  };
  jQuery.extend(jQuery.fn.dataTableExt.oSort, {
    "data-value-pre": function(a) {
      return parseFloat(a.match(/data-value=('|")(.*?)('|")/)[2]);
    },
    "data-value-asc": function(a, b) {
      if (a < b) {
        return -1;
      } else {
        if (a > b) {
          return 1;
        } else {
          return 0;
        }
      }
    },
    "data-value-desc": function(a, b) {
      if (a < b) {
        return 1;
      } else {
        if (a > b) {
          return -1;
        } else {
          return 0;
        }
      }
    }
  });
  $.fn.dataTableExtsErrMode = "throw";
  orgs_table = $("#list_view table").dataTable({
    bFilter: false,
    bAutoWidth: false,
    aaData: [],
    aoColumns: [
      {
        bVisible: false
      }, {
        sWidth: "60px",
        bSortable: false,
        sTitle: "Logo",
        sClass: "text-left",
        fnRender: function(obj) {
          var sReturn;
          sReturn = obj.aData[obj.iDataColumn];
          return "<img class='logo' original='" + sReturn + "' width='48' height='48'> ";
        }
      }, {
        sTitle: "Company",
        sClass: "name text-left",
        fnRender: function(obj) {
          var sReturn;
          sReturn = obj.aData[0];
          return "<a href='/company/" + sReturn + "'>" + obj.aData[obj.iDataColumn] + "</a>";
        }
      }, {
        sTitle: "Connections",
        bSortable: false,
        sType: "data-value",
        sWidth: "120px",
        fnRender: function(obj) {
          var org_id, org_name;
          org_id = obj.aData[0];
          org_name = obj.aData[obj.iDataColumn];
          return "<span class='linkedin-org' data-org-name='" + org_name + "' data-org-id='" + org_id + "'>" + "<span class='linkedin-progress'></span>" + "<table style='display:none;'>" + "  <tr>" + "    <td>" + "       <span class='badge badge-linkedin'>1st</span>" + "    </td>" + "    <td>" + "      <span class='F'>12312312</span>" + "    </td>" + "  </tr>" + "  <tr>" + "    <td>" + "       <span class='badge badge-linkedin'>2nd</span>" + "    </td>" + "    <td>" + "      <span class='S'>12312312</span>" + "    </td>" + "  </tr>" + "</table>" + "</span>";
        }
      }, {
        sTitle: "Badges",
        sType: "data-value",
        sWidth: "120px",
        fnRender: function(obj) {
          var sReturn, value;
          sReturn = obj.aData[obj.iDataColumn];
          value = (sReturn.top50rev ? 8 : 0) + (sReturn.top50emp ? 4 : 0) + (sReturn.camenterprise ? 2 : 0) + (sReturn.businessweekly ? 1 : 0);
          return "<span data-value='" + value + "'>" + (sReturn.top50rev ? "<img src='/img/badge_rev.png' > " : "") + (sReturn.top50emp ? "<img src='/img/badge_emp.png' > " : "") + (sReturn.camenterprise ? "<img src='/img/badge_uni.png' > " : "") + (sReturn.businessweekly ? "<img src='/img/badge_bw.png' > " : "") + "</span>";
        }
      }, {
        sTitle: "Sector",
        sWidth: "160px",
        sType: "string"
      }, {
        bVisible: false
      }, {
        sTitle: "Revenue",
        sType: "data-value",
        sWidth: "120px",
        fnRender: function(obj) {
          var qty, yr;
          qty = obj.aData[obj.iDataColumn];
          yr = obj.aData[obj.iDataColumn - 1];
          return "<span data-value='" + qty + "'>" + qty.formatMoney() + " <span class='smaller'>(" + yr + ")</span>" + "</span>";
        }
      }, {
        sTitle: "Revenue<br/>Change",
        sWidth: "120px",
        sType: "data-value",
        sClass: "text-right",
        fnRender: function(obj) {
          var value;
          value = obj.aData[obj.iDataColumn];
          return "<span data-value='" + value + "' class='" + (value >= 0 ? "positive" : "negative") + "'>" + value.formatMoney() + (value >= 0 ? " ▲" : " ▼") + "</span>";
        }
      }, {
        bVisible: false
      }, {
        sTitle: "Employees",
        sType: "data-value",
        sWidth: "120px",
        fnRender: function(obj) {
          var qty, yr;
          qty = obj.aData[obj.iDataColumn] || 0;
          yr = obj.aData[obj.iDataColumn - 1];
          return "<span data-value='" + qty + "'>" + qty.formatNumber(0, ".", ",") + " <span class='smaller'>(" + yr + ")</span>" + "</span>";
        }
      }, {
        sTitle: "Employee<br/>Change",
        sWidth: "120px",
        sType: "data-value",
        sClass: "text-right",
        fnRender: function(obj) {
          var value;
          value = obj.aData[obj.iDataColumn];
          return "<span data-value='" + value + "' class='" + (value >= 0 ? "positive" : "negative") + "'>" + value.formatNumber(0, ".", ",") + (value >= 0 ? " ▲" : " ▼") + "</span>";
        }
      }
    ],
    bLengthChange: false,
    iDisplayLength: 1000,
    fnDrawCallback: function() {
      return $("#list_view").is(":visible");
    },
    oLanguage: {
      sZeroRecords: "... Loading ..."
    }
  });
  data = _.map(model.org_displaying(), function(c) {
    return [
      c.id, c.profile_image_url || "", c.name || "[NAME]", c.name || "[NAME]", (function() {
        return _.chain(c.tags).filter(function(t) {
          return t.type === "badge";
        }).reduce(function(acc, t) {
          acc[t.tag] = true;
          return acc;
        }, {}).value();
      })(), (function() {
        var tag;
        tag = _.find(c.tags, function(t) {
          return t.type === "sector";
        });
        if (tag) {
          return tag.description;
        } else {
          return null;
        }
      })(), c.last_revenue_year, c.last_revenue || 0, c.revenue_delta || 0, c.last_revenue_year, c.employee_count, c.employee_count_delta || 0
    ];
  });
  orgs_table.fnAddData(data);
  model.org_displaying.subscribe(function(org_displaying) {
    data = void 0;
    if (_.isEmpty(org_displaying)) {
      data = _.map(graph.companies, function(c) {
        return [
          c.id, c.profile_image_url || "_", c.name || "[NAME]", c.name || "[NAME]", (function() {
            return _.chain(c.tags).filter(function(t) {
              return t.type === "badge";
            }).reduce(function(acc, t) {
              acc[t.tag] = true;
              return acc;
            }, {}).value();
          })(), (function() {
            var tag;
            tag = _.find(c.tags, function(t) {
              return t.type === "sector";
            });
            if (tag) {
              return tag.description;
            } else {
              return null;
            }
          })(), c.last_revenue_year, c.last_revenue || 0, c.revenue_delta || 0, c.last_revenue_year, c.employee_count, c.employee_count_delta || 0
        ];
      });
    } else {
      data = _.map(org_displaying, function(c) {
        return [
          c.id, c.profile_image_url || "_", c.name || "[NAME]", c.name || "[NAME]", (function() {
            return _.chain(c.tags).filter(function(t) {
              return t.type === "badge";
            }).reduce(function(acc, t) {
              acc[t.tag] = true;
              return acc;
            }, {}).value();
          })(), (function() {
            var tag;
            tag = _.find(c.tags, function(t) {
              return t.type === "sector";
            });
            if (tag) {
              return tag.description;
            } else {
              return null;
            }
          })(), c.last_revenue_year, c.last_revenue || 0, c.revenue_delta || 0, c.last_revenue_year, c.employee_count, c.employee_count_delta || 0
        ];
      });
    }
    orgs_table.fnClearTable();
    return orgs_table.fnAddData(data);
  });
  load_linkedin_data = function() {
    return $("#list_view .linkedin-org").lazy({
      appear: function(x) {
        var $self, org_name;
        org_name = "comarch";
        $self = $(this);
        return linkedin.get_linkedin_summary(org_name).done(function(summary) {
          $self.find(".linkedin-progress").hide();
          $self.find(".F").text(summary.first_degree);
          $self.find(".S").text(summary.second_degree);
          return $self.find("table").show();
        });
      }
    });
  };
  model.view.subscribe(function(view) {
    if (view === "list") {
      orgs_table.fnAdjustColumnSizing();
      return load_linkedin_data();
    }
  });
  return model.org_displaying.subscribe(function(org_displaying) {
    return load_linkedin_data();
  });
});

define('router', ['api', 'org_view_twitter', 'charts', 'force', 'org_view', 'graph', 'model', 'HandlebarsHelpers'], function(api, org_view_twitter, charts, force, org_view, graph, model) {
  var employee_count, navigate_to_comapany, org_count, sammy, show_map, tag_types, total_revenue,
    _this = this;
  sammy = new Sammy.Application(function() {
    var flash;
    this.debug = true;
    this.use(Sammy.Handlebars, 'hb');
    return flash = {};
  });
  sammy.bind('location-changed', function(a, b, c) {
    return model.location(sammy.getLocation());
  });
  navigate_to_comapany = function(id) {
    return org_view.display_company_details(id, (function(id, org_in_focus) {
      charts.rednder_revenue_overview(org_in_focus);
      return org_view_twitter.display_twitts(org_in_focus.screen_name);
    }), function(egonet) {
      return force.render_directors_network(id, egonet);
    });
  };
  tag_types = _.reduce(graph.orgs, function(acc, c) {
    return _.reduce(c.tags, (function(acc2, t) {
      acc2[t.type] = acc2[t.type] || {};
      acc2[t.type][t.tag] = true;
      return acc2;
    }), acc);
  }, {});
  show_map = (function() {
    var first_map_show;
    first_map_show = true;
    return function(map, CompanyMVC) {
      var companyMVC;
      $('.view').hide();
      $('#loading_view').hide();
      $('#map_view').show();
      model.view('map');
      google.maps.event.trigger(map, 'resize');
      if (first_map_show) {
        companyMVC = new CompanyMVC(map, graph.nodes);
        first_map_show = false;
        return map.panTo(new google.maps.LatLng(52.205, 0.122));
      }
    };
  })();
  $('.company-navi').live('click', function(ev) {
    ev.preventDefault();
    sammy.setLocation('/company/' + $(this).data('id'));
    return null;
  });
  sammy.get("/", function() {
    return require(['map', 'CompanyMVC'], function(map, CompanyMVC) {
      var description;
      $(window).scrollTop(0);
      document.title = model.title + " - " + "All companies";
      model.org_displaying(graph.orgs_by_id);
      description = "All companies";
      return show_map(map, CompanyMVC);
    });
  });
  sammy.get("/company/:id", function() {
    document.title = model.title + " - " + "Company";
    $('.view').hide();
    $('#loading_view').show();
    navigate_to_comapany(this.params["id"]);
    model.view("org");
    $("div.hover-info .outer").hide();
    $(".sticky-content .view").hide();
    $('#loading_view').hide();
    return $("#company_view").show();
  });
  sammy.get("/on_map/:id", function() {
    var org_id;
    require(['CompanyMVC'], function(CompanyMVC) {});
    $(window).scrollTop(0);
    document.title = model.title + " - " + "All companies";
    show_map();
    model.description('');
    org_id = this.params["id"];
    model.focused_node = graph.nodes_by_org_id[org_id];
    model.focused_org = graph.orgs_by_id[org_id];
    return mvc.navigateToNodeByOrgId(focusOverlay, org_id);
  });
  sammy.get("/list", function(context) {
    return require(['orgs_table'], function(orgs_table) {
      $(".view").hide();
      $("#list_view").show();
      model.org_displaying(graph.orgs_by_id);
      return model.view("list");
    });
  });
  sammy.get("/about", function(context) {
    return $(".view").hide();
  });
  sammy.get("/your_browser_is_not_supported", function(context) {
    $(".view").hide();
    $("#not-supported-browser-dialog").show();
    return _gaq.push(["_trackEvent", "browser_unsupported"]);
  });
  _.each(tag_types, function(tag_type, tag_type_name) {
    var tags_regex;
    tags_regex = _.keys(tag_type).join("|");
    return sammy.get(new RegExp("/map/" + tag_type_name + "/(" + tags_regex + ")$"), function(context) {
      return require(['map', 'CompanyMVC'], function(map, CompanyMVC) {
        var org_displaying, tag_value;
        tag_value = context.params.splat[0] || false;
        org_displaying = graph.orgs_by_id;
        if (tag_value) {
          org_displaying = _.reduce(org_displaying, function(acc, org) {
            if (_.any(org.tags, function(tag) {
              if (tag.type === tag_type_name && tag.tag === tag_value) {
                model.description(tag.description);
                return true;
              } else {
                return false;
              }
            })) {
              acc[org.id] = org;
            }
            return acc;
          }, {});
        }
        model.org_displaying(org_displaying);
        $(window).scrollTop(0);
        document.title = model.title + " - " + model.description();
        return show_map(map, CompanyMVC);
      });
    });
  });
  _.each(tag_types, function(tag_type, tag_type_name) {
    var tags_regex;
    tags_regex = _.keys(tag_type).join("|");
    return sammy.get(new RegExp("/list/" + tag_type_name + "/(" + tags_regex + ")$"), function(context) {
      var org_displaying, tag_value;
      tag_value = context.params.splat[0] || false;
      org_displaying = graph.orgs_by_id;
      if (tag_value) {
        org_displaying = _.reduce(org_displaying, function(acc, org) {
          if (_.any(org.tags, function(tag) {
            if (tag.type === tag_type_name && tag.tag === tag_value) {
              model.description(tag.description);
              return true;
            } else {
              return false;
            }
          })) {
            acc[org.id] = org;
          }
          return acc;
        }, {});
      }
      model.org_displaying(org_displaying);
      return require(['orgs_table'], function(orgs_table) {
        $(".view").hide();
        $("#list_view").show();
        return model.view("list");
      });
    });
  });
  sammy.get("", function(context) {
    return context.redirect("/");
  });
  sammy.before(function(context) {
    var top;
    top = sammy.routablePath(this.path).replace(/^\//, "").split("/")[0];
    $("body").attr("class", "");
    if (top !== "") {
      return $("body").addClass(top + "-view");
    } else {
      return $("body").addClass("map-view");
    }
  });
  sammy.before(function(context) {
    return $("#twitter_button").attr("src", "http://platform.twitter.com/widgets/tweet_button.html?count=none&original_referer=" + encodeURIComponent(location.href) + "&url=" + encodeURIComponent(location.href) + "&text=" + encodeURIComponent("Cambridge Cluster Map"));
  });
  sammy.before(function(context) {
    return _gaq.push(["_trackPageview", this.path]);
  });
  org_count = _.size(graph.companies);
  employee_count = _.reduce(graph.companies, function(acc, org) {
    return acc + (org.employee_count || 0);
  }, 0);
  total_revenue = _.reduce(graph.companies, function(acc, org) {
    return acc + (org.last_revenue || 0);
  }, 0);
  $("#count .result").text(org_count.formatNumber(0, ".", ","));
  $("#employee_count .result").text(employee_count.formatNumber(0, ".", ","));
  $("#total_revenue .result").text(total_revenue.formatMoney());
  $(".showing-bar .orgs .n").text(org_count.formatNumber(0, ".", ","));
  $(".showing-bar .emp .n").text(employee_count.formatNumber(0, ".", ","));
  $(".showing-bar .rev .n").text(total_revenue.formatMoney());
  ko.applyBindings(model);
  $('input.search').typeahead({
    source: function(query, process) {
      console.log(query);
      $.when(api.search_org_by_name(query), api.search_tags(query)).then(function(orgs, tags) {
        return process(orgs.concat(tags));
      });
      return void 0;
    },
    sorter: function(items) {
      return items;
    },
    matcher: function() {
      return true;
    },
    highlighter: function(item) {
      if (item.name) {
        return "<div>" + item.name + "</div>";
      } else {
        return "<div>" + item.description + " (" + item.count + ")</div>";
      }
    },
    updater: function(item) {
      if (item.type) {
        return sammy.setLocation("/" + (model.view()) + "/" + item.type + "/" + item.tag);
      } else {
        model.focused_node = void 0;
        model.focused_org = void 0;
        model.org_displaying(graph.orgs_by_id);
        return sammy.setLocation("/company/" + item.id);
      }
    },
    minLength: 3
  });
  if (sammy._location_proxy.has_history) {
    sammy.run();
  } else {
    sammy.run('/#');
  }
  return sammy;
});
//   Copyright 2011 (c) Daniel Kwiecinski. All rights reserved.
//   The use and distribution terms for this software are covered by the
//   Eclipse Public License 1.0 (http://opensource.org/licenses/eclipse-1.0.php)
//   which can be found in the file epl-v10.html at the root of this distribution.
//   By using this software in any fashion, you are agreeing to be bound by
//   the terms of this license.
//   You must not remove this notice, or any other, from this software. 


(function($) {

  function Mutex() {
    this.lock = 0;
  }

  Mutex.prototype.sync = function(originalFunction, resultCallback, exceptionCallback) {
    var isFunction = function(obj) {
      return !!obj && toString.call(obj) === "[object Function]";
    };
    var mutex = this;
    return function() {
      //store original context and arguments of method call
      var that = this;
      var args = Array.prototype.slice.call(arguments);
      //timestamp of function call
      (function attempt() {
        var lock = mutex.lock++;
        if (lock > 0 && console && console.debug) console.debug("mutex lock: " + lock);
        if (lock != 0) {
          setTimeout(attempt, 1); // retry in 10 ms
        } else {
          // >>>>>>>>>>>>>>>>>> critical section
          //
          // call originalFunction in original context with original arguments
          try {
            var result = originalFunction.apply(that, args);
            if (isFunction(resultCallback)) {
              resultCallback.call(that, result);
            }
          } catch(exception) {
            if (isFunction(exceptionCallback)) {
              exceptionCallback.call(that, exception);
            } else {
              console.error && console.error(exception);
            }
          } finally {
            mutex.lock = 0;
          }
          //
          // <<<<<<<<<<<<<<<<<< critical section

        }
      })(); // declare+call
    };
  };


  $.vanadium = {

    mutex: new Mutex(),
    version: '2.0',
    compatible_with_jquery: '1.4.2',

    conf: {
      prefix: ':',
      separator: ';',
      valid_class: 'vanadium-valid',
      advice_class: 'vanadium-advice',
      invalid_class: 'vanadium-invalid',
      message_value_class: 'vanadium-value',
      container_class: 'container',
      language: 'EN'
    },

    validator_types: {},

    guid: 0,

    addValidatorType: function(name, validationFunction, error_message, message, init) {
      $.vanadium.validator_types[name] = new ValidationType(name, validationFunction, error_message, message, init);
    },

    addValidatorTypes: function(validators_args) {
      var self = this;
      _.each(validators_args,
              function(arg) {
                $.vanadium.addValidatorType.apply(self, arg);
              }
      )
    },

    on: function() {
      $('form').live('submit.vanadium', function(e) {
        e.preventDefault();
        try {
          var all_input_elements = $(this).find('input, textarea, chackbox, select');
          $.each(all_input_elements, function() {
            $(this).vanadium().validate().decorate();
          });
        } catch(err) {
          console.log(err);
        }
      });
    },

    off: function() {
      $('form').die('.vanadium');
    },

    /*
     Parses single markup in given elements (Markup is string of the form: VALIDATOR_TYPE[;VALIDATOR_PARAMETER][;ADVICE_ID] |   e.g. :required | :alpha | :wait;500 | :min_length;5 | :ajax;/user_exists.json
     */
    parse_markup: function(mk) {
      if (mk.indexOf($.vanadium.conf.prefix) == 0) {
        var tokens = mk.substr($.vanadium.conf.prefix.length).split($.vanadium.conf.separator);
        for (var key in tokens) {
          if (tokens[key] == "") {
            tokens[key] = undefined
          }
        }
        return tokens;
      } else {
        return undefined;
      }
    },

    validation_instance: function(tokens) {
      var v_name = tokens[0];
      if (v_name != 'only_on_blur' && v_name != 'only_on_submit' && v_name != 'wait' && v_name != 'advice') {
        var v_param = tokens[1];
        var v_advice_id = tokens[2];
        return {name:v_name, param:v_param, advice_id:v_advice_id};
      }
      return undefined;
    },

    validation_modifier: function(tokens) {
      var m_name = tokens[0];
      var m_param = tokens[1];
      if (m_name == 'only_on_blur' || m_name == 'only_on_submit') {
        //  whether you want it to validate as you type or only on blur  (DEFAULT: false)
        return {m_name: true};
      } else if (m_name == 'wait') {
        //  the time you want it to pause from the last keystroke before it validates (ms) (DEFAULT: 0)
        var milisesonds = parseInt(m_param);
        if (milisesonds != NaN && typeof(milisesonds) === "number") {
          return {wait: milisesonds};
        }
      } else if (m_name == 'advice') {
        return {advice_id: m_param};
      }
      return undefined;
    },

    parse: function(element) {
      var $element = $(element);
      var validation_instances = [];
      var validation_modifiers = {};


      var markup;
      if ($element.attr('data-vanadium')) {
        // try data-vanadium attribute first
        markup = $element.attr('data-vanadium').split(' ');
      } else if ($element.attr('class')) {
        // try css-class markup
        markup = $element.attr('class').split(' ');
      }
      if (markup) {
        _.each(markup, function(mk) {
          var tokens = $.vanadium.parse_markup(mk);
          if (tokens) {
            validation_instances.push($.vanadium.validation_instance(tokens));
            $.extend(validation_modifiers, $.vanadium.validation_modifier(tokens));
          }
        });
      }
      return [_.filter(validation_instances, function(vi) {
        return vi
      }), validation_modifiers];
    }

  };

  function is_in_dom(element) {
    return $(element).parent().size() > 0;
  }

  function ValidationType(name, validationFunction, error_message, message, init) {
    // private variables
    var self = this;
    this.name = name;
    this.message = message;
    this.error_message = error_message;
    this.validationFunction = validationFunction;
    this.init = init || $.noop;

    // API methods
    $.extend(self, {
      test: function(value, param, element, complete) {
        var result_callback_called = false;
        var result_callback = function(test_success) {
          if (!result_callback_called) {
            result_callback_called = true;
            complete(test_success);
          }
        };
        var result = this.validationFunction.call(this, value, param, element, result_callback);
        if (result !== undefined && !result_callback_called) {
          result_callback_called = true;
          if (complete) complete(result);
        }
      },
      validMessage: function() {
        return this.message;
      },
      invalidMessage: function() {
        return this.error_message;
      },
      toString: function() {
        return "name:" + this.name + " message:" + this.message + " error_message:" + this.error_message
      }
    });
  }

  function Vanadium(element) {

    // private variables
    var self = this;
    var validation_instances = [];
    var validation_modifiers = {};
    var validation_results = undefined;

    var uid = $.vanadium.guid++;

    var validate_decorate_mutex = new Mutex();

    var validation_in_progress = false;
    //

    // API methods
    $.extend(self, {

      parse: function() {
        var parsing_result = $.vanadium.parse(element);
        validation_instances = parsing_result[0];
        validation_modifiers = parsing_result[1];
        _.each(validation_instances, function(vi) {
          vi.element = element;
        });
        return self;
      },

      validate: function(e) {
        this.parse();
        validation_results = {};
        _.each(validation_instances, function(v_instance) {
          // v_instance == {name:v_name, param:v_param, advice_id:v_advice_id};
          var validation_type = $.vanadium.validator_types[v_instance.name];
          if (validation_type) {
            validation_type.init(v_instance);
            if (!validation_results[validation_type.name] || !validation_type[validation_type.name].success) {
              validation_type.test(element.val(), v_instance.param, element.get(0), validate_decorate_mutex.sync(function(test_success) {
                validation_in_progress = true;
                var message = test_success ? validation_type.message : validation_type.error_message;
                if ($.isFunction(message)) {
                  message = message(element.val(), v_instance.param, self);
                }
                var result = {success: test_success, name: validation_type.name, advice_id: v_instance.advice_id, message: message};
                validation_results[validation_type.name] = result;
                var advice_id = v_instance.advice_id || validation_modifiers.advice_id;
                if (advice_id && $('#' + advice_id).size() == 1) {
                  var advice = $('#' + advice_id);
                  if (!advice.data('vanadium-elements')) {
                    advice.data('vanadium-elements', {});
                  }
                  if (!advice.data('vanadium-elements')[uid]) {
                    advice.data('vanadium-elements')[uid] = {};
                  }
                  advice.data('vanadium-elements')[uid][validation_type.name] = result;
                }
                validation_in_progress = false;
              }));
            }
          }
        });
        element.trigger('on-validate');
        return self;
      },


      decorate_advice: function(advice) {
        var elements = advice.data('vanadium-elements');
        var valid = true;

        var advice_copy = $('<div>' + advice.html() + '</div>');
        advice_copy.find('.' + $.vanadium.conf.advice_class).remove();

        var messages = [];

        if (elements) {
          _.each(elements, function(validation_results) {
            _.each(validation_results, function(vr) {
              if (vr.message) messages.push(vr);
              valid = valid && vr.success;
            });
          })
        }

        if (valid) {
          advice.addClass($.vanadium.conf.valid_class);
          advice.removeClass($.vanadium.conf.invalid_class);
        } else {
          advice.removeClass($.vanadium.conf.advice_class);
          advice.removeClass($.vanadium.conf.valid_class);
          advice.addClass($.vanadium.conf.invalid_class);
        }

        if (advice_copy.html().trim() != "") {
          if (valid) {
            advice.hide();
          } else {
            advice.show();
          }
        } else {
          if (messages.length == 0) {
            advice.hide();
          } else {
            advice.html('');
            _.each(messages, function(m) {
              //TODO implement more clever way of replacing messages so we do not delete them over and over again
              var message_el = $('<span class="' + $.vanadium.conf.advice_class + '"></span>').html(m.message);
              if (m.success) {
                message_el.addClass($.vanadium.conf.valid_class);
                message_el.removeClass($.vanadium.conf.invalid_class);
              } else {
                message_el.removeClass($.vanadium.conf.advice_class);
                message_el.removeClass($.vanadium.conf.valid_class);
                message_el.addClass($.vanadium.conf.invalid_class);
              }
              advice.append(message_el);
            });
            advice.show();
          }
        }
      },


      // wait for validation to finish if validation is in progress
      // or execute it imiediately if otherwise
      decorate: validate_decorate_mutex.sync(function() {
        if (validation_results && _.size(validation_results) > 0) {
          if (_.some(_.values(validation_results), function(validation_result) {
            return !validation_result.success;
          })) {
            element.removeClass($.vanadium.conf.valid_class);
            element.addClass($.vanadium.conf.invalid_class);
          } else {
            element.addClass($.vanadium.conf.valid_class);
            element.removeClass($.vanadium.conf.invalid_class);
          }
        } else {
          element.removeClass($.vanadium.conf.valid_class);
          element.removeClass($.vanadium.conf.invalid_class);
        }
        {


          _.each(validation_instances, function(vr) {
            var advice_id = vr.advice_id || validation_modifiers.advice_id;
            if (advice_id && $('#' + advice_id).size() > 0) {
              self.decorate_advice($('#' + advice_id));
            }
          });

          _.each(validation_results, function(vr) {
            var advice_id = vr.advice_id || validation_modifiers.advice_id;
            if (advice_id && $('#' + advice_id).size() > 0) {
              self.decorate_advice($('#' + advice_id));
            }
          });
        }
        {
          var containers = $(element).parents('.\\' + $.vanadium.conf.prefix + $.vanadium.conf.container_class);
          if (containers.size() > 0) {
            if (!containers.data('vanadium-elements')) {
              containers.data('vanadium-elements', {});
            }
            containers.data('vanadium-elements')[uid] = this;
            containers.each(function() {
              var container = $(this);
              var invalid = _.some(container.data('vanadium-elements'), function(vanad, uid) {
                if (vanad.element().parent().size() == 0) {
                  // if the element has no parent, it implies it was removed from DOM so we can't treat it as invalid
                  $(vanad.element()).removeData("vanadium-vanad");
                  vanad.element(undefined);
                  delete container.data('vanadium-elements')[uid];
                  return false;
                } else {
                  return _.some(vanad.validation_results(), function(v_result) {
                    return !v_result.success;
                  });
                }
              });
              if (invalid) {
                $(this).removeClass($.vanadium.conf.valid_class);
                $(this).addClass($.vanadium.conf.invalid_class);
              } else {
                $(this).addClass($.vanadium.conf.valid_class);
                $(this).removeClass($.vanadium.conf.invalid_class);
              }

            });
          }
        }
        element.trigger('on-decorate');
        return self;
      }),

      reset_advice: function(advice) {
        var elements = advice.data('vanadium-elements');

        if (elements) {
          delete elements[uid];
          //self.decorate_advice(advice);
        }
      },

      reset: function() {
        _.each(validation_results, function(vr) {
          if (vr.advice_id && $('#' + vr.advice_id).size() > 0) {
            self.reset_advice($('#' + vr.advice_id));
          }
        });
        validation_results = undefined;
        element.trigger('on-reset');
        return self;
      },

      uid: function() {
        return uid;
      },

      validation_results: function() {
        return validation_results;
      },

      element: function(new_value) {
        var old_value = element;
        if (arguments.length > 0) {
          element = new_value;
        }
        return old_value;
      },

      valid: function() {
        if (element.get(0).tagName == "FORM") {
          return _.reduce(element.find('input, textarea, select'), function(acc, element) {
            return acc && !_.some($(element).vanadium().validation_results() || [], function(validation_result) {
              return !validation_result.success;
            })
          }, true)
        } else {
          if (validation_results) {
            return !_.some(validation_results, function(validation_result) {
              return !validation_result.success;
            })
          } else {
            return true;
          }
        }
      }

    });

  }


  $.fn.vanadium = function() {

    var element = $(this);
    //
    var vanad = element.data("vanadium-vanad");
    if (!vanad) {
      vanad = new Vanadium(element);
      $(element).data("vanadium-vanad", vanad);
    }
    return vanad;
  };

  $.fn.valid = function() {
    var element = $(this);
    if (element.get(0).tagName == "INPUT" || element.get(0).tagName == "TEXTAREA" || element.get(0).tagName == "SELECT") {
      return element.vanadium().valid();
    } else {
      return _.reduce(element.find('input, textarea, select'), function(acc, e) {
        if (!$(e).valid()) {
          acc = acc && false;
        }
        return acc;
      }, true);
    }
  };

  $.fn.validate = function() {
    return this.each(function() {
      var element = $(this);
      if (this.tagName == "FORM") {
        _.each(element.find('input, textarea, select'), function(e) {
          $(e).validate();
        });
      } else {
        element.vanadium().validate();
      }
    });
  };

  $.fn.decorate = function() {
    return this.each(function() {
      var element = $(this);
      if (this.tagName == "FORM") {
        _.each(element.find('input, textarea, select'), function(e) {
          $(e).decorate();
        });
      } else {
        element.vanadium().decorate();
      }
    });
  };

  $.fn.reset = function() {
    return this.each(function() {
      var element = $(this);
      if (this.tagName == "FORM") {
        _.each(element.find('input, textarea, select'), function(e) {
          $(e).reset();
        });
      } else {
        element.vanadium().reset();
      }
    });
  };

  if ($().jquery.indexOf($.vanadium.compatible_with_jquery) != 0 && window.console && window.console.warn)
    console.warn("This version of Vanadium is tested with jQuery " + $.vanadium.compatible_with_jquery +
            " it may not work as expected with this version (" + $().jquery + ")");

  //build-in validator types

  // Validation type definition is array of:
  // 1. name of validator type
  // 2. test function expecting 1..4 arguments -- v, p, validation_element, result_callback

  function isFieldEmpty(v) {
    return  ((v == null) || (v.length == 0));
  }

  $.vanadium.addValidatorType('empty', isFieldEmpty);

  $.vanadium.addValidatorTypes([
    ['equal', function(v, p) {
      return v == p;
    }, function (_v, p) {
      return 'The value should be equal to <span class="' + $.vanadium.conf.message_value_class + '">' + p + '</span>.'
    }],
    //
    ['equal_ignore_case', function(v, p) {
      return v.toLowerCase() == p.toLowerCase();
    }, function (_v, p) {
      return 'The value should be equal to <span class="' + $.vanadium.conf.message_value_class + '">' + p + '</span>.'
    }],
    //
    ['required', function(v) {
      return !isFieldEmpty(v);
    }, 'This is a required field.'],
    //
    ['accept', function(v, _p, e) {
      return e.checked;
    }, 'Must be accepted!'],
    //
    ['integer', function(v) {
      if (isFieldEmpty(v)) return true;
      var f = parseFloat(v);
      return (!isNaN(f) && f.toString() == v && Math.round(f) == f);
    }, 'Please enter a valid integer in this field.'],
    //
    ['number', function(v) {
      return isFieldEmpty(v) || (!isNaN(v) && !/^\s+$/.test(v));
    }, 'Please enter a valid number in this field.'],
    //
    ['float', function(v) {
      return isFieldEmpty(v) || (!isNaN(v) && !/^\s+$/.test(v));
    }, 'Please enter a valid number in this field.'],
    //
    ['digits', function(v) {
      return isFieldEmpty(v) || !/[^\d]/.test(v);
    }, 'Please use numbers only in this field. please avoid spaces or other characters such as dots or commas.'],
    //
    ['alpha', function (v) {
      return isFieldEmpty(v) || /^[a-zA-Z\u00C0-\u00FF\u0100-\u017E\u0391-\u03D6]+$/.test(v);   //% C0 - FF (� - �); 100 - 17E (? - ?); 391 - 3D6 (? - ?)
    }, 'Please use letters only in this field.'],
    //
    ['asciialpha', function (v) {
      return isFieldEmpty(v) || /^[a-zA-Z]+$/.test(v);   //% C0 - FF (� - �); 100 - 17E (? - ?); 391 - 3D6 (? - ?)
    }, 'Please use ASCII letters only (a-z) in this field.'],
    ['alphanum', function(v) {
      return isFieldEmpty(v) || !/\W/.test(v)
    }, 'Please use only letters (a-z) or numbers (0-9) only in this field. No spaces or other characters are allowed.'],
    //
    ['date', function(v) {
      var test = new Date(v);
      return isFieldEmpty(v) || !isNaN(test);
    }, 'Please enter a valid date.'],
    //
    ['email', function (v) {
      return (isFieldEmpty(v)
              ||
              /[\w\.]{1,}[@][\w\-]{1,}([.]([\w\-]{1,})){1,3}$/.test(v))
    }, 'Please enter a valid email address. For example fred@domain.com .'],
    //
    ['url', function (v) {
      return isFieldEmpty(v) || /^(http|https|ftp):\/\/(([A-Z0-9][A-Z0-9_-]*)(\.[A-Z0-9][A-Z0-9_-]*)+)(:(\d+))?\/?/i.test(v)
    }, 'Please enter a valid URL.'],
    //
    ['date_au', function(v) {
      if (isFieldEmpty(v)) return true;
      var regex = /^(\d{2})\/(\d{2})\/(\d{4})$/;
      if (!regex.test(v)) return false;
      var d = new Date(v.replace(regex, '$2/$1/$3'));
      return ( parseInt(RegExp.$2, 10) == (1 + d.getMonth()) ) && (parseInt(RegExp.$1, 10) == d.getDate()) && (parseInt(RegExp.$3, 10) == d.getFullYear() );
    }, 'Please use this date format: dd/mm/yyyy. For example 17/03/2006 for the 17th of March, 2006.'],
    //
    ['currency_dollar', function(v) {
      // [$]1[##][,###]+[.##]
      // [$]1###+[.##]
      // [$]0.##
      // [$].##
      return isFieldEmpty(v) || /^\$?\-?([1-9]{1}[0-9]{0,2}(,[0-9]{3})*(\.[0-9]{0,2})?|[1-9]{1}\d*(\.[0-9]{0,2})?|0(\.[0-9]{0,2})?|(\.[0-9]{1,2})?)$/.test(v)
    }, 'Please enter a valid $ amount. For example $100.00 .'],
    //
    ['selection', function(v, p, vi) { //TODO TEST
      return elm.options ? elm.selectedIndex > 0 : !isFieldEmpty(v);
    }, 'Please make a selection'],
    //
    ['one_required',
      function (v, p, vi) {   //TODO TEST
        var options = jQuery('input[name="' + elm.name + '"]');
        return _.some(options, function(elm) {
          return $(elm).value()
        });
      }, 'Please select one of the above options.'],
    //
    ['length',
      function (v, p) {
        if (p === undefined) {
          return true
        } else {
          return v.length == parseInt(p)
        }
      },
      function (_v, p) {
        return 'The value should be <span class="' + $.vanadium.conf.message_value_class + '">' + p + '</span> characters long.'
      }
    ],
    //
    ['min_length',
      function (v, p) {
        if (p === undefined) {
          return true
        } else {
          return v.length >= parseInt(p)
        }
      },
      function (_v, p) {
        return 'The value should be at least <span class="' + $.vanadium.conf.message_value_class + '">' + p + '</span> characters long.'
      }
    ],
    ['max_length',
      function (v, p) {
        if (p === undefined) {
          return true
        } else {
          return v.length <= parseInt(p)
        }
      },
      function (_v, p) {
        return 'The value should be at most <span class="' + $.vanadium.conf.message_value_class + '">' + p + '</span> characters long.'
      }
    ],
    ['same_as',
      //the first parameter is validation test function
      function (v, p) {
        if (p === undefined) {
          return true
        } else {
          var exemplar = document.getElementById(p);
          if (exemplar)
            return v == exemplar.value;
          else
            return false;
        }
      },
      //the second parameter (string or function) is failure message
      function (v, p, vi) {
        var exemplar = document.getElementById(p);
        if (exemplar)
          return 'The value should be the same as in <span class="' + $.vanadium.conf.message_value_class + '">' + (jQuery(exemplar).attr('name') || exemplar.id) + '</span> .';
        else
          return 'There is no exemplar item!!!'
      },
      //the third parameter (string or function) is success message
      function() {
        return "ALL RIGHT !!!"
      },
      // the fourth parameter is the validation_type init function called once before validation
      function(validation_instance) {
        var exemplar = document.getElementById(validation_instance.param);
        if (exemplar) {
          jQuery(exemplar).unbind('on-validate.__internal');
          jQuery(exemplar).bind('on-validate.__internal', function() {
            jQuery(validation_instance.element).validate().decorate();
          });
        }
      }
    ],
    ['ajax',
      function (v, p, validation_element, result_callback) {
        var cb = function(a, b, c, d, e) {
          result_callback();
        };
        if (isFieldEmpty(v)) {
          result_callback(true);
        } else {
          jQuery.ajax({
            url: p,
            data: {value: v, id: validation_element.id},
            success: cb,//result_callback,
            error: cb//result_callback
          });
        }
      }]
    ,
    ['format',
      function(v, p) {
        var params = p.match(/^\/(((\\\/)|[^\/])*)\/(((\\\/)|[^\/])*)$/);
        if (params && params.length == 7) {
          var pattern = params[1];
          var attributes = params[4];
          try {
            var exp = new RegExp(pattern, attributes);
            return exp.test(v);
          }
          catch(err) {
            return false
          }
        } else {
          return false
        }
      },
      function (_v, p) {
        var params = p.split('/');
        if (params.length == 3 && params[0] == "") {
          return 'The value should match the <span class="' + $.vanadium.conf.message_value_class + '">' + p.toString() + '</span> pattern.';
        } else {
          return 'provided parameter <span class="' + $.vanadium.conf.message_value_class + '">' + p.toString() + '</span> is not valid Regexp pattern.';
        }
      }
    ]
  ]);

})(jQuery);


// on document ready

$(function() {
  var user_config = JSON.parse($('script[type="text/x-vanadiumjs-config"]').html() || "{}");
  $.vanadium.conf = $.extend($.vanadium.conf, user_config);
  if ($.vanadium.conf.enable_on_init) {
    $.vanadium.on(); // turn the vanadium on
  }
  $('input, textarea, select').live('blur', function() {
    if ($.vanadium.conf.default_validate_on_blur) {
      $(this).vanadium().validate().decorate();
    }
  });
  $('input, textarea, select').live('focus', function() {
    $(this).vanadium().reset().decorate();
  });
});




