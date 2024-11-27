import { useState } from 'react';
import {
  Box,
  VStack,
  Select,
  Textarea,
  Button,
  Text,
  List,
  ListItem,
} from '@chakra-ui/react';
import { useForm, Controller } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';

type SlackMessage = {
  user: string;
  text: string;
  timestamp: string;
};

const formSchema = z.object({
  slackToken: z.string().min(1, 'Slack token is required'),
  openAiToken: z.string().min(1, 'OpenAI token is required'),
  threadUrl: z.string().url('Please enter a valid Slack thread URL'),
  language: z.enum(['en', 'zh-Hant']),
  prompt: z.string().optional(),
  followUpQuestion: z.string().optional(),
});

type FormData = z.infer<typeof formSchema>;

const SlackSummariser = () => {
  const [messages, setMessages] = useState<SlackMessage[]>([]);
  const [summary, setSummary] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      language: 'en',
      prompt: 'Please summarise this Slack thread conversation',
    },
  });

  const handleFormSubmit = async (data: FormData) => {
    setIsLoading(true);
    try {
      // TODO: Implement API calls to fetch Slack messages and generate summary
      // This will be implemented in the next step
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Box maxW="800px" mx="auto" p={6}>
      <VStack spacing={6} align="stretch">
        <Controller
          name="slackToken"
          control={control}
          render={({ field }) => (
            <FormControl isInvalid={!!errors.slackToken}>
              <FormLabel>Slack Token</FormLabel>
              <Input type="password" {...field} />
              <FormErrorMessage>{errors.slackToken?.message}</FormErrorMessage>
            </FormControl>
          )}
        />

        <Controller
          name="openAiToken"
          control={control}
          render={({ field }) => (
            <FormControl isInvalid={!!errors.openAiToken}>
              <FormLabel>OpenAI Token</FormLabel>
              <Input type="password" {...field} />
              <FormErrorMessage>{errors.openAiToken?.message}</FormErrorMessage>
            </FormControl>
          )}
        />

        <Controller
          name="threadUrl"
          control={control}
          render={({ field }) => (
            <FormControl isInvalid={!!errors.threadUrl}>
              <FormLabel>Slack Thread URL</FormLabel>
              <Input {...field} />
              <FormErrorMessage>{errors.threadUrl?.message}</FormErrorMessage>
            </FormControl>
          )}
        />

        <Controller
          name="language"
          control={control}
          render={({ field }) => (
            <FormControl>
              <FormLabel>Language</FormLabel>
              <Select {...field}>
                <option value="en">English</option>
                <option value="zh-Hant">Traditional Chinese</option>
              </Select>
            </FormControl>
          )}
        />

        <Controller
          name="prompt"
          control={control}
          render={({ field }) => (
            <FormControl>
              <FormLabel>Custom Prompt</FormLabel>
              <Textarea {...field} />
            </FormControl>
          )}
        />

        <Button
          colorScheme="blue"
          onClick={handleSubmit(handleFormSubmit)}
          isLoading={isLoading}
        >
          Generate Summary
        </Button>

        {messages.length > 0 && (
          <Box>
            <Text fontSize="lg" fontWeight="bold" mb={2}>
              Conversation
            </Text>
            <List spacing={3}>
              {messages.map((message, index) => (
                <ListItem key={index} p={3} bg="gray.50" borderRadius="md">
                  <Text fontWeight="bold">{message.user}</Text>
                  <Text>{message.text}</Text>
                  <Text fontSize="sm" color="gray.500">
                    {new Date(message.timestamp).toLocaleString()}
                  </Text>
                </ListItem>
              ))}
            </List>
          </Box>
        )}

        {summary && (
          <Box>
            <Text fontSize="lg" fontWeight="bold" mb={2}>
              Summary
            </Text>
            <Box p={4} bg="blue.50" borderRadius="md">
              <Text>{summary}</Text>
            </Box>
          </Box>
        )}

        <Controller
          name="followUpQuestion"
          control={control}
          render={({ field }) => (
            <FormControl>
              <FormLabel>Ask for More Details</FormLabel>
              <Textarea
                {...field}
                placeholder="Ask a follow-up question about the summary..."
              />
            </FormControl>
          )}
        />
      </VStack>
    </Box>
  );
};

export default SlackSummariser;
