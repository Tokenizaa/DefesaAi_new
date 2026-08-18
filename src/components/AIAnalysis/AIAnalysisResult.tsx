import React from 'react';
import { Card, CardHeader, CardContent, Box, Typography, Badge, Button } from '@/components/ui';
import { Spinner } from '@/components/ui/Spinner';

interface Field {
  name: string;
  value: string;
  confidence: number;
}

interface Infraction {
  id: string;
  description: string;
  confidence: number;
}

interface AIAnalysisResultProps {
  fields: Field[];
  legalClassification: string;
  strategyRecommendations: string[];
  infractionDetails: Infraction[];
  isLoading: boolean;
  onError?: () => void;
}

export const AIAnalysisResult: React.FC<AIAnalysisResultProps> = ({
  fields,
  legalClassification,
  strategyRecommendations,
  infractionDetails,
  isLoading,
  onError,
}) => {
  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" h="100vh">
        <Spinner />
      </Box>
    );
  }

  return (
    <Card>
      <CardHeader>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Typography variant="h6" fontWeight="medium">
            AI Analysis Results
          </Typography>
          <Button onClick={() => {}} size="sm" variant="outline">
            Close
          </Button>
        </Box>
      </CardHeader>
      <CardContent>
        <Box mb={4}>
          <Typography variant="subtitle1" fontWeight="medium">
            Extracted Fields
          </Typography>
          <Box display="grid" gridTemplateColumns="repeat(auto-fill, minmax(200px, 1fr))" gap={4}>
            {fields.map((field) => (
              <Box key={field.name}>
                <Box display="flex" justifyContent="space-between" alignItems="center">
                  <Typography variant="body2" fontWeight="medium">
                    {field.name}
                  </Typography>
                  <Badge
                    variant="filled"
                    color="green"
                    className="ml-1"
                    children={Math.round(field.confidence * 100).toString()}
                  />
                </Box>
              </Box>
            ))}
          </Box>
        </Box>

        <Box mb={4}>
          <Typography variant="subtitle1" fontWeight="medium">
            Legal Classification
          </Typography>
          <Typography variant="body2" color="gray.600">
            {legalClassification}
          </Typography>
        </Box>

        <Box mb={4}>
          <Typography variant="subtitle1" fontWeight="medium">
            Strategy Recommendations
          </Typography>
          <ul className="list-disc list-inside">
            {strategyRecommendations.map((rec, idx) => (
              <li key={idx}>{rec}</li>
            ))}
          </ul>
        </Box>

        <Box mb={4}>
          <Typography variant="subtitle1" fontWeight="medium">
            High‑Confidence Infractions
          </Typography>
          {infractionDetails.length > 0 ? (
            <ul className="list-disc list-inside">
              {infractionDetails.map((inf) => (
                <li key={inf.id}>
                  <Box display="flex" justifyContent="space-between" alignItems="center">
                    <Typography variant="body2">
                      {inf.description}
                    </Typography>
                    <Badge
                      variant="filled"
                      color="red"
                      className="ml-1"
                      children={Math.round(inf.confidence * 100).toString()}
                    />
                  </Box>
                </li>
              ))}
            </ul>
          ) : (
            <Typography variant="body2" color="gray.500">
              No high‑confidence infractions detected.
            </Typography>
          )}
        </Box>
      </CardContent>
    </Card>
  );
};