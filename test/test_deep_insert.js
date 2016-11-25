/* Any copyright is dedicated to the Public Domain.
 * http://creativecommons.org/publicdomain/zero/1.0/ */

/* global after, before */

'use strict';

import app       from './server';
import db        from '../src/models/db';
import should    from 'should';
import supertest from 'supertest';

import {
  datastreams,
  datastreamsNavigationLink,
  featuresOfInterest,
  iotCount,
  iotId,
  locations,
  locationsNavigationLink,
  observations,
  observationTypes,
  observedProperties,
  sensors,
  things
} from './constants';

const server = supertest.agent(app.listen('8001'));

const fetch = url => {
  return new Promise(resolve => {
    server.get(url)
    .expect('Content-Type', /json/)
    .expect(200)
    .end((err, res) => {
      should.not.exist(err);
      resolve(res);
    });
  });
};

db().then(models => {
  const prepath = '/v1.0/';
  const serverUrl = 'http://127.0.0.1:8001';
  describe('Deep insert', () => {
    let observationId;

    before(done => {
      let promises = [];
      [datastreams,
       locations,
       observations,
       observedProperties,
       featuresOfInterest,
       sensors,
       things].forEach(model => {
        promises.push(models[model].destroy({ where: {} }));
      });
      Promise.all(promises).then(() => {
        const body = {
          'phenomenonTime': '2015-01-25T20:00:00.000Z',
          'result': {
            'key': 'value'
          },
          'resultTime': '2015-01-25T20:00:00.000Z',
          'validTime': '2015-01-25T20:00:00.000Z',
          'parameters': [
            {
              'key': 'value'
            }
          ],
          'FeatureOfInterest': {
            'name': 'name',
            'description': 'description',
            'encodingType': 'application/vnd.geo+json',
            'feature': {
              'type': 'Point',
              'coordinates': [-117.05, 51.05]
            }
          },
          'Datastream': {
            'name': 'name',
            'description': 'description',
            'unitOfMeasurement': {
              'symbol': '%',
              'name': 'Percentage',
              'definition': 'http://www.qudt.org/qudt/owl/1.0.0/unit/Instances.html'
            },
            'phenomenonTime': '2015-01-25T20:00:00.000Z',
            'resultTime': '2015-01-25T20:00:00.000Z',
            'observationType': 'http://www.opengis.net/def/observationType/OGC-OM/2.0/OM_Observation',
            'Thing': {
              'name': 'name',
              'description': 'description',
              'properties': {
                'key': 'value'
              }
            },
            'Sensor': {
              'name': 'name',
              'description': 'description',
              'encodingType': 'application/pdf',
              'metadata': 'http://example.org/TMP35_36_37.pdf'
            },
            'ObservedProperty': {
              'name': 'name',
              'definition': 'definition',
              'description': 'description'
            }
          }
        };

        server.post(prepath + observations).send(body)
        .expect('Content-Type', /json/)
        .expect(201)
        .end((err, res) => {
          should.not.exist(err);
          observationId = res.body[iotId];
          done();
        });
      });
    });

    after(done => {
      // Make sure that 'deep' deletion also works by deleting
      // the recently inserted Thing. It should delete all associated
      // Datastreams and all associated Observations.
      server.delete(prepath + observations + '(' + observationId + ')')
      .expect(204)
      .end(err => {
        should.not.exist(err);
        fetch(prepath + observations).then(res => {
          // There should be no Observations.
          res.body[iotCount].should.be.equal(0);
          return fetch(prepath + datastreams);
        }).then(res => {
          // There should be no Datastreams.
          res.body[iotCount].should.be.equal(0);
          return fetch(prepath + featuresOfInterest);
        }).then(res => {
          // There should be no Datastreams.
          res.body[iotCount].should.be.equal(0);
          done();
        });
      });
    });

    it('should create Observation entity and all its associations', done => {
      let datastreamsLink;
      fetch(prepath + observations).then(res => {
        console.log(res.body)
        done();
      });
    });
  });
});
