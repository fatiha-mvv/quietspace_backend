import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import axios from 'axios';
import { TypeElemBruit } from './entities/type-elem-bruit.entity';

/**
 * Interface représentant un élément bruyant avec ses coordonnées
 */
interface ElementBruyant {
  idTypeElemBruit: number;
  type: string;
  latitude: number;
  longitude: number;
  nom?: string;
}

/**
 * Interface pour le détail d'impact d'un élément
 */
interface ImpactDetail {
  type: string;
  nom?: string;
  distance: number;
  impact: number;
  poids: number;
  dHalf: number;
}

/**
 * Interface pour le résultat du calcul
 */
interface ScoreCalmeResult {
  scoreFinal: number;
  niveauCalme: string;
  scoreBase: number;
  totalImpact: number;
  impactsDetails: ImpactDetail[];
  elementsDetectes: number;
}


@Injectable()
export class CalmeCalculatorService {
  private readonly logger = new Logger(CalmeCalculatorService.name);

  constructor(
   @InjectRepository(TypeElemBruit)
   private readonly typeElemBruitRepository: Repository<TypeElemBruit>,
  ) {}

  /**
   * Mapping des tags OSM vers les types d'éléments bruyants de votre BDD
   */
  private readonly OSM_TAG_MAPPING: Record<string, number> = {
    // Éducation
    'amenity=school': 1,              // ECOLE
    'amenity=college': 1,             // ECOLE (collège)
    'amenity=university': 1,          // ECOLE (université)
    
    // Culte
    'amenity=place_of_worship|religion=muslim': 2,  // MOSQUEE
    
    // Routes
    'highway=trunk': 3,               // ROUTE_NATIONALE
    'highway=primary': 3,             // ROUTE_NATIONALE
    
    // Artisanat
    'craft=carpenter': 4,             // MENUISERIE
    'shop=hardware': 4,               // MENUISERIE
    
    // Commerce
    'amenity=cafe': 5,                // CAFE
    'amenity=fast_food': 5,           // CAFE (similaire)
    
    // Sport
    'leisure=stadium': 6,             // STADE
    'leisure=sports_centre': 6,       // STADE (centre sportif)
    'leisure=pitch': 6,               // STADE (terrain)
    
    // Chantier/Construction
    'landuse=construction': 7,        // CHANTIER
    'construction=yes': 7,            // CHANTIER
    
    // Centre commercial
    'shop=mall': 8,                   // CENTRE_COMMERCIAL
    'shop=supermarket': 8,            // CENTRE_COMMERCIAL
    'amenity=marketplace': 8,         // CENTRE_COMMERCIAL (marché)
    
    // Transport
    'railway=station': 9,             // GARE
    'public_transport=station': 9,    // GARE
  };

  /**
   * Cache pour les configurations des types d'éléments bruyants
   */
  private configCache: Map<number, { poids: number; dHalf: number; type: string }> = new Map();

  /**
   * Charge les configurations depuis la base de données
   */
  async loadTypeElemBruitConfig(): Promise<void> {
    try {
      console.log('\n========== CHARGEMENT DES CONFIGURATIONS ==========');
      const types = await this.typeElemBruitRepository.find();
      
      this.configCache.clear();
      for (const type of types) {
        this.configCache.set(type.id_type_elem_bruit, {
          poids: type.poids,
          dHalf: type.d_half,
          type: type.type_elem_bruit
        });
      console.log(`=>Type ${type.id_type_elem_bruit} (${type.type_elem_bruit}): poids=${type.poids}, d_half=${type.d_half}m`);

      }
      console.log(`\n=>Total: ${types.length} types d'éléments bruyants chargés\n`);
    } catch (error) {
      console.error('ERREUR lors du chargement des types:', error);
      throw error;
    }
  }

  /**
   * Récupère la configuration d'un type d'élément
   */
  private async getTypeConfig(idType: number): Promise<{ poids: number; dHalf: number; type: string } | null> {
    if (this.configCache.size === 0) {
      await this.loadTypeElemBruitConfig();
    }
    return this.configCache.get(idType) || null;
  }

  /**
   * Récupère les éléments bruyants autour d'un lieu via Overpass API
   * @param latitude Latitude du lieu (WGS84)
   * @param longitude Longitude du lieu (WGS84)
   * @param radius Rayon de recherche en mètres (défaut: 200m)
   */
  async getElementsBruyants(
    latitude: number,
    longitude: number,
    radius: number = 200
  ): Promise<ElementBruyant[]> {
    try {
      console.log('\n========== RÉCUPÉRATION DES ÉLÉMENTS BRUYANTS ==========');
      console.log(`=>Position du lieu: (${latitude}, ${longitude})`);
      console.log(`=>Rayon de recherche: ${radius}m\n`);
      // S'assurer que la config est chargée
      if (this.configCache.size === 0) {
        await this.loadTypeElemBruitConfig();
      }

      // Construction de la requête Overpass
      const overpassQuery = this.buildOverpassQuery(latitude, longitude, radius);
      console.log('*****Envoi de la requête à Overpass API...');      
      // Appel à l'API Overpass
      const response = await axios.post(
        // 'https://overpass-api.de/api/interpreter', // ne marche pas
        // 'https://lz4.overpass-api.de/api/interpreter', // ne marche pas 
        //  'https://overpass.kumi.systems/api/interpreter',//=> khedam mais ti7ma9
          // 'https://overpass.openstreetmap.ru/api/interpreter',// ne marche pas 
          'https://z.overpass-api.de/api/interpreter', // khedam mais ti7ma9 
        overpassQuery,
        {
          headers: { 'Content-Type': 'text/plain' },
          timeout: 60000 // 60 secondes
        }
      );
      console.log(`=>Réponse reçue: ${response.data.elements?.length || 0} éléments bruts d'OSM\n`);
      // Parsing des résultats
      const elements = this.parseOverpassResponse(response.data);
      console.log(`\n=> ${elements.length} éléments bruyants détectés après filtrage\n`);
      //Resumé par type--DEBUT
      const typeCounts = elements.reduce((acc, el) => {
        acc[el.type] = (acc[el.type] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);
      
      console.log('=>Résumé par type:');
      Object.entries(typeCounts).forEach(([type, count]) => {
        console.log(`  • ${type}: ${count}`);
      });
      console.log('');

      //Resumé par type--FIN
      
      return elements;
    } catch (error) {
      console.error('ERREUR lors de la récupération des éléments bruyants:', error.message);
      // En cas d'erreur, retourner un tableau vide plutôt que de bloquer le calcul
      return [];
    }
  }

  /**
   * Construit la requête OverpassQL basée sur vos types d'éléments
   */
  private buildOverpassQuery(lat: number, lon: number, radius: number): string {
    const queries = [
      // ECOLE (id=1)
      'node["amenity"~"school|college|university"](around:RADIUS,LAT,LON);',
      'way["amenity"~"school|college|university"](around:RADIUS,LAT,LON);',
      
      // MOSQUEE (id=2)
      'node["amenity"="place_of_worship"]["religion"="muslim"](around:RADIUS,LAT,LON);',
      'way["amenity"="place_of_worship"]["religion"="muslim"](around:RADIUS,LAT,LON);',
      
      // ROUTE_NATIONALE (id=3)
      'way["highway"~"trunk|primary"](around:RADIUS,LAT,LON);',
      
      // MENUISERIE (id=4)
      'node["craft"="carpenter"](around:RADIUS,LAT,LON);',
      'way["craft"="carpenter"](around:RADIUS,LAT,LON);',
      'node["shop"="hardware"](around:RADIUS,LAT,LON);',
      
      // CAFE (id=5)
      'node["amenity"~"cafe|fast_food"](around:RADIUS,LAT,LON);',
      'way["amenity"~"cafe|fast_food"](around:RADIUS,LAT,LON);',
      
      // STADE (id=6)
      'node["leisure"~"stadium|sports_centre|pitch"](around:RADIUS,LAT,LON);',
      'way["leisure"~"stadium|sports_centre|pitch"](around:RADIUS,LAT,LON);',
      
      // CHANTIER (id=7)
      'way["landuse"="construction"](around:RADIUS,LAT,LON);',
      'node["construction"="yes"](around:RADIUS,LAT,LON);',
      'way["construction"="yes"](around:RADIUS,LAT,LON);',
      
      // CENTRE_COMMERCIAL (id=8)
      'node["shop"~"mall|supermarket"](around:RADIUS,LAT,LON);',
      'way["shop"~"mall|supermarket"](around:RADIUS,LAT,LON);',
      'node["amenity"="marketplace"](around:RADIUS,LAT,LON);',
      'way["amenity"="marketplace"](around:RADIUS,LAT,LON);',
      
      // GARE (id=9)
      'node["railway"="station"](around:RADIUS,LAT,LON);',
      'node["public_transport"="station"](around:RADIUS,LAT,LON);',
      'way["railway"="station"](around:RADIUS,LAT,LON);',
    ];

    const allQueries = queries
      .map(q => q.replace(/RADIUS/g, radius.toString())
                  .replace(/LAT/g, lat.toString())
                  .replace(/LON/g, lon.toString()))
      .join('\n');

    return `[out:json][timeout:90];
(
  ${allQueries}
);
out center;`;
  }

  /**
   * Parse la réponse de l'API Overpass
   */
  private parseOverpassResponse(data: any): ElementBruyant[] {
    const elements: ElementBruyant[] = [];
    
    if (!data.elements || !Array.isArray(data.elements)) {
      return elements;
    }
    console.log('Parsing des éléments OSM...');
    

    for (const element of data.elements) {
      // Récupérer les coordonnées
      let lat: number, lon: number;
      
      if (element.type === 'node') {
        lat = element.lat;
        lon = element.lon;
      } else if (element.center) {
        lat = element.center.lat;
        lon = element.center.lon;
      } else {
        continue; // Ignorer si pas de coordonnées
      }

      // Identifier le type d'élément
      const typeInfo = this.identifyElementType(element.tags);
      
      if (typeInfo) {
        elements.push({
          idTypeElemBruit: typeInfo.id,
          type: typeInfo.type,
          latitude: lat,
          longitude: lon,
          nom: element.tags?.name || element.tags?.['name:fr'] || element.tags?.['name:ar'] || undefined
        });
      }
    }

    return elements;
  }

  /**
   * Identifie le type d'élément à partir des tags OSM
   */
  private identifyElementType(tags: Record<string, string>): { id: number; type: string } | null {
    if (!tags) return null;

    // ECOLE
    if (tags.amenity && ['school', 'college', 'university'].includes(tags.amenity)) {
      return { id: 1, type: 'ECOLE' };
    }

    // MOSQUEE
    if (tags.amenity === 'place_of_worship' && tags.religion === 'muslim') {
      return { id: 2, type: 'MOSQUEE' };
    }

    // ROUTE_NATIONALE
    if (tags.highway && ['trunk', 'primary'].includes(tags.highway)) {
      return { id: 3, type: 'ROUTE_NATIONALE' };
    }

    // MENUISERIE
    if (tags.craft === 'carpenter' || tags.shop === 'hardware') {
      return { id: 4, type: 'MENUISERIE' };
    }

    // CAFE
    if (tags.amenity && ['cafe', 'fast_food'].includes(tags.amenity)) {
      return { id: 5, type: 'CAFE' };
    }

    // STADE
    if (tags.leisure && ['stadium', 'sports_centre', 'pitch'].includes(tags.leisure)) {
      return { id: 6, type: 'STADE' };
    }

    // CHANTIER
    if (tags.landuse === 'construction' || tags.construction === 'yes') {
      return { id: 7, type: 'CHANTIER' };
    }

    // CENTRE_COMMERCIAL
    if ((tags.shop && ['mall', 'supermarket'].includes(tags.shop)) || tags.amenity === 'marketplace') {
      return { id: 8, type: 'CENTRE_COMMERCIAL' };
    }

    // GARE
    if (tags.railway === 'station' || tags.public_transport === 'station') {
      return { id: 9, type: 'GARE' };
    }

    return null;
  }

  /**
   * Convertit des coordonnées WGS84 (SRID 4326) en UTM Zone 29N (SRID 32629)
   * Zone UTM 29N couvre le Maroc occidental (Casablanca)
   */
  private wgs84ToUtm29N(lat: number, lon: number): { x: number; y: number } {
    const a = 6378137.0; // Rayon équatorial WGS84
    const e = 0.081819191; // Excentricité WGS84
    const k0 = 0.9996; // Facteur d'échelle
    const lonOrigin = -9; // Méridien central de la zone 29N
    const falseEasting = 500000; // False Easting
    const falseNorthing = 0; // False Northing (hémisphère nord)
    
    const latRad = lat * Math.PI / 180;
    const lonRad = lon * Math.PI / 180;
    const lonOriginRad = lonOrigin * Math.PI / 180;
    
    const N = a / Math.sqrt(1 - Math.pow(e * Math.sin(latRad), 2));
    const T = Math.pow(Math.tan(latRad), 2);
    const C = Math.pow(e * Math.cos(latRad), 2) / (1 - Math.pow(e, 2));
    const A = (lonRad - lonOriginRad) * Math.cos(latRad);
    
    const M = a * (
      (1 - Math.pow(e, 2) / 4 - 3 * Math.pow(e, 4) / 64 - 5 * Math.pow(e, 6) / 256) * latRad -
      (3 * Math.pow(e, 2) / 8 + 3 * Math.pow(e, 4) / 32 + 45 * Math.pow(e, 6) / 1024) * Math.sin(2 * latRad) +
      (15 * Math.pow(e, 4) / 256 + 45 * Math.pow(e, 6) / 1024) * Math.sin(4 * latRad) -
      (35 * Math.pow(e, 6) / 3072) * Math.sin(6 * latRad)
    );
    
    const x = falseEasting + k0 * N * (
      A + 
      (1 - T + C) * Math.pow(A, 3) / 6 +
      (5 - 18 * T + Math.pow(T, 2) + 72 * C - 58 * Math.pow(e, 2)) * Math.pow(A, 5) / 120
    );
    
    const y = falseNorthing + k0 * (
      M + N * Math.tan(latRad) * (
        Math.pow(A, 2) / 2 +
        (5 - T + 9 * C + 4 * Math.pow(C, 2)) * Math.pow(A, 4) / 24 +
        (61 - 58 * T + Math.pow(T, 2) + 600 * C - 330 * Math.pow(e, 2)) * Math.pow(A, 6) / 720
      )
    );
    
    return { x, y };
  }

  /**
   * Calcule la distance euclidienne entre deux points en coordonnées projetées (UTM)
   */
  private calculateDistance(
    lat1: number, lon1: number,
    lat2: number, lon2: number
  ): number {
    // Convertir en UTM 29N (SRID 32629)
    const point1 = this.wgs84ToUtm29N(lat1, lon1);
    const point2 = this.wgs84ToUtm29N(lat2, lon2);
    
    // Distance euclidienne en mètres
    const dx = point2.x - point1.x;
    const dy = point2.y - point1.y;
    
    return Math.sqrt(dx * dx + dy * dy);
  }

  /**
   * Calcule l'impact d'un élément bruyant selon la formule exponentielle
   * Impact_i = w × e^(-ln(2) × (d_i / d_half))
   */
  private calculateImpact(
    distance: number,
    poids: number,
    dHalf: number
  ): number {
    // Formule exacte de votre document
    const exponent = -Math.LN2 * (distance / dHalf);
    const impact = poids * Math.exp(exponent);
    
    return impact;
  }

  /**
   * Détermine le niveau de calme en fonction du score
   */
  private getNiveauCalme(score: number): string {
       if (score >= 80 && score <= 100) {
      return 'Très calme';
    } else if (score >= 60 && score <= 79) {
      return 'Calme';
    } else if (score >= 40 && score <= 59) {
      return 'Assez bruyant';
    } else if (score >= 0 && score <= 39) {
      return 'Très bruyant';
    } else {
      return 'Non défini';
    }
  }


  

  /**
   * Calcule le score de calme complet d'un lieu
   * @param lieuLat Latitude du lieu (WGS84)
   * @param lieuLon Longitude du lieu (WGS84)
   * @param scoreBase Score de base du type de lieu (0-100)
   * @param elements Liste des éléments bruyants (optionnel, sinon récupération auto)
   * @param searchRadius Rayon de recherche en mètres (défaut: 200m)
   */
  async calculateScoreCalme(
    lieuLat: number,
    lieuLon: number,
    scoreBase: number,
    elements?: ElementBruyant[],
    searchRadius: number = 200
  ): Promise<ScoreCalmeResult> {

    console.log('\n\n');
    console.log('*******************************************************');
    console.log('           CALCUL DU SCORE DE CALME');
    console.log('*******************************************************');
    console.log(`=>Coordonnées du lieu: (${lieuLat}, ${lieuLon})`);
    console.log(`=>Score de base: ${scoreBase}/100`);
    console.log(`=>Rayon de recherche: ${searchRadius}m`);
    console.log('*******************************************************\n');
    
    // Si les éléments ne sont pas fournis, les récupérer via Overpass
    const elementsBruyants = elements || 
      await this.getElementsBruyants(lieuLat, lieuLon, searchRadius);
     console.log('\n************ CALCUL DES IMPACTS ************\n');

    const impactsDetails: ImpactDetail[] = [];
    let totalImpact = 0;
    let elementIndex = 1;//var just pour les console log , a supprimé
    // Calculer l'impact de chaque élément
    for (const element of elementsBruyants) {
      console.log(`\n--- Élément ${elementIndex}/${elementsBruyants.length} ---`);
      console.log(`*Type: ${element.type}${element.nom ? ` (${element.nom})` : ''}`);
      console.log(`*Position: (${element.latitude}, ${element.longitude})`);

      const config = await this.getTypeConfig(element.idTypeElemBruit);
      
      if (!config) {
        console.log(`!Configuration non trouvée pour le type ${element.idTypeElemBruit} - IGNORÉ\n`);
        continue;
      }
      console.log(`=>Paramètres: poids=${config.poids}, d_half=${config.dHalf}m`);
      // Calculer la distance en mètres (dans le système projeté UTM 29N)
      const distance = this.calculateDistance(
        lieuLat, lieuLon,
        element.latitude, element.longitude
      );

      console.log(`=>Distance calculée: ${distance.toFixed(1)}m`);
      // Calculer l'impact selon la formule: Impact = w × e^(-ln(2) × d/d_half)
      const exponent = -Math.LN2 * (distance / config.dHalf);//var just pour les consoles log , a supprimé
      const impact = this.calculateImpact(distance, config.poids, config.dHalf);
      console.log(`---Calcul de l'impact:`);
      console.log(`   Formule: Impact = poids × e^(-ln(2) × distance/d_half)`);
      console.log(`   Exposant: -ln(2) × (${distance.toFixed(1)}/${config.dHalf}) = ${exponent.toFixed(4)}`);
      console.log(`   Impact: ${config.poids} × e^(${exponent.toFixed(4)}) = ${impact.toFixed(2)}`);
      
      totalImpact += impact;
      console.log(`=>Impact cumulé: ${totalImpact.toFixed(2)}`);
      impactsDetails.push({
        type: config.type,
        nom: element.nom,
        distance: Math.round(distance * 10) / 10, // Arrondir à 1 décimale
        impact: Math.round(impact * 100) / 100, // Arrondir à 2 décimales
        poids: config.poids,
        dHalf: config.dHalf
      });

        elementIndex++;//juste pour l'affichage dans console log
    }

     console.log('\n\n*********** CALCUL DU SCORE FINAL ***********\n');
    console.log(`=>Nombre d'éléments bruyants détectés: ${elementsBruyants.length}`);
    console.log(`=>Score de base: ${scoreBase}`);
    console.log(`=>Impact total des éléments: ${totalImpact.toFixed(1)}`);
    console.log(`----------------------------------------------------`);

    // Calcul du score final: Score(L) = Base(L) + Σ impacts
    // Note: les impacts sont NÉGATIFS, donc on les AJOUTE (ce qui diminue le score)
    const scoreRaw = scoreBase + totalImpact;
    console.log(`=>Score brut: ${scoreBase} + (${totalImpact.toFixed(1)}) = ${scoreRaw.toFixed(1)}`);
    // Borner entre 0 et 100: ScoreFinal = max(0, min(100, Score(L)))
    const scoreFinal = Math.max(0, Math.min(100, scoreRaw));
    console.log(`=>Score final (borné 0-100): ${scoreFinal.toFixed(1)}`);
    // Déterminer le niveau de calme
    const niveauCalme = this.getNiveauCalme(scoreFinal);
    console.log(`=>Niveau de calme: ${niveauCalme}`);

    console.log('\n*********************************************************');
    console.log('              FIN DU CALCUL');
    console.log('*********************************************************\n\n');

    return {
      scoreFinal: Math.round(scoreFinal * 10) / 10, // Arrondir à 1 décimale
      niveauCalme,
      scoreBase,
      totalImpact: Math.round(totalImpact * 10) / 10,
      impactsDetails: impactsDetails.sort((a, b) => a.impact - b.impact), // Trier par impact croissant
      elementsDetectes: elementsBruyants.length
    };
  }

  /**
   * Scores de base selon les types de lieux
   */
  readonly SCORES_BASE: Record<number, number> = {
    1: 90,  // BIBLIOTHEQUE
    2: 70,  // CAFE
    3: 80,  // COWORKING
    4: 85,  // SALLE_ETUDE
  };

  /**
   * Récupère le score de base depuis un id_type_lieu
   */
  getScoreBase(idTypeLieu: number): number {
    return this.SCORES_BASE[idTypeLieu] || 70; // Valeur par défaut
  }
}
